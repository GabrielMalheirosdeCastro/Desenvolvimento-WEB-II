#!/bin/bash
# scripts/diag-net.sh - investiga redes Docker do API e do Supabase
set +e

API_CT=$(docker ps --format '{{.Names}}' | grep -i acolhimento | head -1)
POOLER_CT=$(docker ps --format '{{.Names}}' | grep -i pooler | head -1)
DB_CT=$(docker ps --format '{{.Names}}' | grep -E 'supabase-db|supabase_db' | head -1)

echo "=== containers ==="
echo "API:    $API_CT"
echo "POOLER: $POOLER_CT"
echo "DB:     $DB_CT"

echo
echo "=== redes do container API ==="
docker inspect "$API_CT" --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool 2>/dev/null | grep -E '":|NetworkID|IPAddress' | head -30 || \
  docker inspect "$API_CT" --format '{{json .NetworkSettings.Networks}}'

echo
echo "=== redes do POOLER ==="
docker inspect "$POOLER_CT" --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool 2>/dev/null | grep -E '":|NetworkID|IPAddress' | head -30 || \
  docker inspect "$POOLER_CT" --format '{{json .NetworkSettings.Networks}}'

echo
echo "=== redes do DB ==="
docker inspect "$DB_CT" --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool 2>/dev/null | grep -E '":|NetworkID|IPAddress' | head -30 || \
  docker inspect "$DB_CT" --format '{{json .NetworkSettings.Networks}}'

echo
echo "=== todas redes docker (overlay/bridge) ==="
docker network ls

echo
echo "=== service spec: networks da API ==="
docker service inspect desenvolvimento_web_acolhimento_faesa --format '{{json .Spec.TaskTemplate.Networks}}'

echo
echo "=== teste de IP direto: descobre IP do pooler e tenta TCP do API ==="
POOLER_IP=$(docker inspect "$POOLER_CT" --format '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' | tr ' ' '\n' | grep -v '^$' | head -1)
echo "POOLER_IP=$POOLER_IP"
if [ -n "$POOLER_IP" ]; then
  docker exec "$API_CT" sh -c "node -e \"const net=require('net');const s=net.connect(6543,'$POOLER_IP',()=>{console.log('TCP OK ->',s.remoteAddress+':'+s.remotePort);s.end();});s.on('error',e=>console.log('TCP ERRO',e.code,e.message));setTimeout(()=>process.exit(0),3000);\""
fi

echo
echo "=== FIM ==="
