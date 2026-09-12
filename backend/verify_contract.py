import asyncio
from datetime import datetime, timezone
try:
    from httpx import AsyncClient, ASGITransport
    def get_client():
        return AsyncClient(transport=ASGITransport(app=app), base_url='http://test')
except ImportError:
    from httpx import AsyncClient
    def get_client():
        return AsyncClient(app=app, base_url='http://test')

from main import app, startup_event

OBS_BODY = {
    'ward_id': 'W1',
    'timestamp': datetime.now(timezone.utc).isoformat(),
    'detected_people_count': 100,
    'confidence': 0.9,
    'source_type': 'manual_entry'
}
RS_BODY = {
    'edge_id': 'E1',
    'status': 'open',
    'timestamp': datetime.now(timezone.utc).isoformat(),
    'source_type': 'manual_entry'
}

ENDPOINTS = [
    ('GET',  '/scenario',             None),
    ('GET',  '/hazard',               None),
    ('GET',  '/priorities',           None),
    ('GET',  '/assignments',          None),
    ('GET',  '/route/Team_Alpha/W1',  None),
    ('POST', '/observation',          OBS_BODY),
    ('POST', '/road-status',          RS_BODY),
]

async def verify():
    startup_event()
    async with get_client() as ac:
        print('README API contract vs live endpoints:')
        all_pass = True
        for method, path, body in ENDPOINTS:
            if method == 'POST':
                r = await ac.post(path, json=body)
            else:
                r = await ac.get(path)
            ok = r.status_code == 200
            if not ok:
                all_pass = False
            label = 'PASS' if ok else 'FAIL'
            print('  [' + label + '] ' + method + ' ' + path + ' -> ' + str(r.status_code))
        print()
        print('All match:', all_pass)

asyncio.run(verify())
