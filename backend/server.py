from fastapi import FastAPI, APIRouter, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import pandas as pd
import numpy as np
import glob
import re
from typing import Optional

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global DataFrames
df_enrol = None
df_demo = None
df_bio = None
state_summary = None
enrol_monthly = None

def clean_state_name(s):
    """Clean and standardize state names"""
    if pd.isna(s):
        return s
    s = s.strip().upper()
    s = re.sub(r'\s+', ' ', s)
    s = s.replace('&', 'AND')
    return s

def load_and_process_data():
    """Load CSVs and compute aggregations"""
    global df_enrol, df_demo, df_bio, state_summary, enrol_monthly
    
    try:
        DATA_DIR = "/app/uidai_data"
        
        logger.info("Loading CSV files...")
        
        # Load enrolment files
        enrol_files = glob.glob(os.path.join(DATA_DIR, "api_data_aadhar_enrolment_*.csv"))
        if not enrol_files:
            logger.warning("No enrolment files found")
            df_enrol = pd.DataFrame()
        else:
            df_enrol = pd.concat([pd.read_csv(f) for f in enrol_files], ignore_index=True)
        
        # Load demographic files
        demo_files = glob.glob(os.path.join(DATA_DIR, "api_data_aadhar_demographic_*.csv"))
        if not demo_files:
            logger.warning("No demographic files found")
            df_demo = pd.DataFrame()
        else:
            df_demo = pd.concat([pd.read_csv(f) for f in demo_files], ignore_index=True)
        
        # Load biometric files
        bio_files = glob.glob(os.path.join(DATA_DIR, "api_data_aadhar_biometric_*.csv"))
        if not bio_files:
            logger.warning("No biometric files found")
            df_bio = pd.DataFrame()
        else:
            df_bio = pd.concat([pd.read_csv(f) for f in bio_files], ignore_index=True)
        
        logger.info(f"Loaded {len(df_enrol)} enrolment records, {len(df_demo)} demographic records, {len(df_bio)} biometric records")
        
        # Parse dates
        for df in [df_enrol, df_demo, df_bio]:
            if not df.empty and 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y', errors='coerce')
        
        # Clean state names
        for df in [df_enrol, df_demo, df_bio]:
            if not df.empty and 'state' in df.columns:
                df['state'] = df['state'].apply(clean_state_name)
        
        # State mapping for standardization
        state_map = {
            'WESTBENGAL': 'WEST BENGAL',
            'WEST BENGAL ': 'WEST BENGAL',
            'WEST BANGAL': 'WEST BENGAL',
            'WEST BENGLI': 'WEST BENGAL',
            'DAMAN & DIU': 'DAMAN AND DIU',
            'CHHATISGARH': 'CHHATTISGARH',
            'UTTARANCHAL': 'UTTARAKHAND',
            'ORISSA': 'ODISHA',
            'TAMILNADU': 'TAMIL NADU',
            'PONDICHERRY': 'PUDUCHERRY',
            'DADRA AND NAGAR HAVELI': 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
            'DAMAN AND DIU': 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
            'THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU': 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
            'BALANAGAR': 'TELANGANA',
            'DARBHANGA': 'BIHAR',
            'MADANAPALLE': 'ANDHRA PRADESH',
            'NAGPUR': 'MAHARASHTRA',
            'RAJA ANNAMALAI PURAM': 'TAMIL NADU',
            'PUTTENAHALLI': 'KARNATAKA',
            '100000': 'UNKNOWN',
        }
        
        for df in [df_enrol, df_demo, df_bio]:
            if not df.empty and 'state' in df.columns:
                df['state'] = df['state'].replace(state_map)
        
        # Drop UNKNOWN from state-level analysis
        if not df_enrol.empty:
            df_enrol = df_enrol[df_enrol['state'] != 'UNKNOWN']
        if not df_demo.empty:
            df_demo = df_demo[df_demo['state'] != 'UNKNOWN']
        if not df_bio.empty:
            df_bio = df_bio[df_bio['state'] != 'UNKNOWN']
        
        # Compute state-level aggregations
        logger.info("Computing state-level aggregations...")
        
        if not df_enrol.empty:
            enrol_state_totals = df_enrol.groupby('state')[['age_0_5', 'age_5_17', 'age_18_greater']].sum()
            enrol_state_totals['total_enrol'] = enrol_state_totals.sum(axis=1)
        else:
            enrol_state_totals = pd.DataFrame(columns=['total_enrol'])
        
        if not df_demo.empty:
            demo_state_totals = df_demo.groupby('state')[['demo_age_5_17', 'demo_age_17_']].sum()
            demo_state_totals['total_demo_updates'] = demo_state_totals.sum(axis=1)
        else:
            demo_state_totals = pd.DataFrame(columns=['total_demo_updates'])
        
        if not df_bio.empty:
            bio_state_totals = df_bio.groupby('state')[['bio_age_5_17', 'bio_age_17_']].sum()
            bio_state_totals['total_bio_updates'] = bio_state_totals.sum(axis=1)
        else:
            bio_state_totals = pd.DataFrame(columns=['total_bio_updates'])
        
        # Combine summaries
        if not enrol_state_totals.empty:
            state_summary = enrol_state_totals[['total_enrol']].reset_index()
        else:
            state_summary = pd.DataFrame(columns=['state', 'total_enrol'])
        
        if not demo_state_totals.empty:
            demo_reset = demo_state_totals[['total_demo_updates']].reset_index()
            state_summary = state_summary.merge(
                demo_reset, 
                on='state', 
                how='left'
            )
        else:
            state_summary['total_demo_updates'] = 0
        
        if not bio_state_totals.empty:
            bio_reset = bio_state_totals[['total_bio_updates']].reset_index()
            state_summary = state_summary.merge(
                bio_reset, 
                on='state', 
                how='left'
            )
        else:
            state_summary['total_bio_updates'] = 0
        
        state_summary = state_summary.fillna(0)
        state_summary['demo_per_enrol'] = state_summary['total_demo_updates'] / state_summary['total_enrol']
        state_summary['bio_per_enrol'] = state_summary['total_bio_updates'] / state_summary['total_enrol']
        state_summary = state_summary.replace([np.inf, -np.inf], 0)
        
        # Compute monthly enrolment
        logger.info("Computing monthly enrolment...")
        if not df_enrol.empty:
            enrol_monthly = df_enrol.groupby(df_enrol['date'].dt.to_period('M'))[['age_0_5', 'age_5_17', 'age_18_greater']].sum()
            enrol_monthly['total_enrol'] = enrol_monthly.sum(axis=1)
            enrol_monthly = enrol_monthly.reset_index()
            enrol_monthly['month'] = enrol_monthly['date'].astype(str)
            enrol_monthly = enrol_monthly[['month', 'total_enrol']]
        else:
            enrol_monthly = pd.DataFrame(columns=['month', 'total_enrol'])
        
        logger.info("Data processing complete")
        
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        # Initialize empty dataframes on error
        df_enrol = pd.DataFrame()
        df_demo = pd.DataFrame()
        df_bio = pd.DataFrame()
        state_summary = pd.DataFrame()
        enrol_monthly = pd.DataFrame()

@app.on_event("startup")
async def startup_event():
    """Load data on startup"""
    load_and_process_data()

@api_router.get("/")
async def root():
    return {"message": "Aadhaar Intelligence Console API"}

@api_router.get("/state-summary")
async def get_state_summary():
    """Get summary statistics for all states"""
    if state_summary is None or state_summary.empty:
        return []
    return state_summary.to_dict('records')

@api_router.get("/top-states")
async def get_top_states(
    metric: str = Query(default="total_enrol", regex="^(total_enrol|total_demo_updates|total_bio_updates)$"),
    n: int = Query(default=10, ge=1, le=50)
):
    """Get top N states by specified metric"""
    if state_summary is None or state_summary.empty:
        return []
    
    top_states = state_summary.nlargest(n, metric)[['state', metric]]
    return top_states.to_dict('records')

@api_router.get("/anomaly-points")
async def get_anomaly_points():
    """Get scatter plot data for anomaly detection"""
    if state_summary is None or state_summary.empty:
        return []
    
    anomaly_data = state_summary[['state', 'demo_per_enrol', 'bio_per_enrol']].copy()
    anomaly_data['is_anomaly'] = (
        (anomaly_data['demo_per_enrol'] > 20) | 
        (anomaly_data['bio_per_enrol'] > 30)
    )
    return anomaly_data.to_dict('records')

@api_router.get("/monthly-enrolment")
async def get_monthly_enrolment():
    """Get monthly enrolment time series"""
    if enrol_monthly is None or enrol_monthly.empty:
        return []
    return enrol_monthly.to_dict('records')

@api_router.get("/stats")
async def get_stats():
    """Get overall statistics"""
    if state_summary is None or state_summary.empty:
        return {
            "total_states": 0,
            "total_enrolments": 0,
            "total_demo_updates": 0,
            "total_bio_updates": 0
        }
    
    return {
        "total_states": len(state_summary),
        "total_enrolments": int(state_summary['total_enrol'].sum()),
        "total_demo_updates": int(state_summary['total_demo_updates'].sum()),
        "total_bio_updates": int(state_summary['total_bio_updates'].sum())
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)