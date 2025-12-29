from app.keycloak_collector import KeycloakEventCollector
c = KeycloakEventCollector()
print(f'Config: url={c.keycloak_url}, realm={c.realm}, client={c.client_id}, user={c.admin_user}, pass={c.admin_password}')
token = c.get_admin_token()
if token:
    print(f'Token obtained: {token[:50]}...')
    events = c.get_events(token, since_minutes=120)
    print(f'Events fetched: {len(events)}')
    if events:
        for e in events[:10]:
            print(f"  {e.get('type')} - {e.get('details', {}).get('username', 'N/A')} - {e.get('error', '-')}")
    # Now process all
    result = c.collect_and_process()
    print(f'Result: {result}')
else:
    print('Failed to get token')
