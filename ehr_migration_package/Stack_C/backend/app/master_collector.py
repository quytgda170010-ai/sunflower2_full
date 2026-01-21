"""
Master Collector - Runs all log collectors for SIEM system

This script:
1. Executes all 6 collectors in sequence
2. Aggregates results
3. Logs summary to console and database
"""
import logging
import sys
from datetime import datetime

# Import all collectors
try:
    from keycloak_collector import KeycloakEventCollector
    from tls_collector import TLSCollector
    from gateway_collector import GatewayCollector
    from opa_collector import OPACollector
    from db_collector import DatabaseCollector
except ImportError as e:
    logging.error(f"Import error: {e}")
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_all_collectors():
    """Run all collectors and aggregate results"""
    logger.info("=" * 80)
    logger.info("Starting SIEM Master Collector")
    logger.info("=" * 80)
    
    results = {}
    
    # 1. Keycloak Collector (Authentication)
    try:
        logger.info("\n[1/5] Running Keycloak Collector...")
        collector = KeycloakEventCollector()
        results['keycloak'] = collector.collect_and_process()
        logger.info(f"✅ Keycloak: {results['keycloak']}")
    except Exception as e:
        logger.error(f"❌ Keycloak Collector failed: {e}")
        results['keycloak'] = {'error': str(e)}
    
    # 2. Gateway Collector (Nginx Logs)
    try:
        logger.info("\n[2/5] Running Gateway Collector...")
        collector = GatewayCollector()
        results['gateway'] = collector.collect_and_process()
        logger.info(f"✅ Gateway: {results['gateway']}")
    except Exception as e:
        logger.error(f"❌ Gateway Collector failed: {e}")
        results['gateway'] = {'error': str(e)}
    
    # 3. OPA Collector (Policy Decisions)
    try:
        logger.info("\n[3/5] Running OPA Collector...")
        collector = OPACollector()
        results['opa'] = collector.collect_and_process()
        logger.info(f"✅ OPA: {results['opa']}")
    except Exception as e:
        logger.error(f"❌ OPA Collector failed: {e}")
        results['opa'] = {'error': str(e)}
    
    # 4. Database Collector (MariaDB Queries)
    try:
        logger.info("\n[4/4] Running Database Collector...")
        collector = DatabaseCollector()
        results['db'] = collector.collect_and_process()
        logger.info(f"✅ Database: {results['db']}")
    except Exception as e:
        logger.error(f"❌ Database Collector failed: {e}")
        results['db'] = {'error': str(e)}
    
    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("COLLECTION SUMMARY")
    logger.info("=" * 80)
    
    total_inserted = 0
    for name, result in results.items():
        if 'error' not in result:
            inserted = result.get('logs_inserted', result.get('events_inserted', 0))
            total_inserted += inserted
            logger.info(f"{name.upper():15s}: {inserted} logs inserted")
        else:
            logger.error(f"{name.upper():15s}: ERROR - {result['error']}")
    
    logger.info(f"\n{'TOTAL':15s}: {total_inserted} logs inserted")
    logger.info("=" * 80)
    
    return results


if __name__ == '__main__':
    start_time = datetime.now()
    logger.info(f"Start time: {start_time}")
    
    results = run_all_collectors()
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    logger.info(f"End time: {end_time}")
    logger.info(f"Duration: {duration:.2f} seconds")
    logger.info("Master Collector completed.")
