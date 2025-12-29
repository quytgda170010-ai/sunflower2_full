#!/bin/bash
# Script to run database migration for adding cccd and bhyt columns

echo "Running migration to add cccd and bhyt columns..."

# Get database credentials from environment or use defaults
DB_HOST=${DB_HOST:-mariadb}
DB_NAME=${MARIADB_DATABASE:-ehr_core}
DB_USER=${MARIADB_USER:-openemr}
DB_PASS=${MARIADB_PASSWORD:-Openemr!123}

# Run migration
docker exec -i mariadb mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < migrations/add_cccd_bhyt_to_patients.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
else
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi




