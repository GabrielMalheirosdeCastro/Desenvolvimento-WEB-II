#!/bin/bash
# Diagnostico de producao: confirma seed, env do container, logs reais do service
# e testa conectividade do pooler (postgres.gmc) vs direct (postgres).
set +e

echo "=== 1) count gabriel via DIRECT (supabase-db, user=postgres) ==="
docker exec -i supabase-db psql -U postgres -d postgres -c \
  "SELECT id, matricula_institucional, nome, tipo_usuario FROM usuarios WHERE matricula_institucional='23110145';"

echo ""
echo "=== 2) container API ==="
APIC=$(docker ps --format '{{.Names}}' | grep -i acolh | head -1)
echo "container: $APIC"
echo "--- env relevante ---"
docker exec "$APIC" env 2>&1 | grep -E '^(DATABASE_URL|NODE_ENV|DIRECT_URL)=' || echo "(nada)"

echo ""
echo "=== 3) service docker swarm (filtro por grep, nao --filter) ==="
SVC=$(docker service ls --format '{{.Name}}' | grep -i acolh | head -1)
echo "service: $SVC"
if [ -n "$SVC" ]; then
  echo "--- ultimas 120 linhas do log do service ---"
  docker service logs --tail 120 "$SVC" 2>&1 | tail -80
  echo ""
  echo "--- linhas com 'db' ou 'query' ou 'erro' (case-insensitive) ---"
  docker service logs --tail 300 "$SVC" 2>&1 | grep -i -E '\[db\]|query|error|erro' | tail -40
fi

echo ""
echo "=== 4) teste pooler postgres.gmc -> ve usuarios? ==="
docker exec "$APIC" sh -c 'PGPASSWORD=Rafaebiel_01_Gmc psql -h supabase-pooler -p 6543 -U postgres.gmc -d postgres -c "SELECT current_user, current_database(), (SELECT count(*) FROM usuarios) AS qtd_usuarios;"' 2>&1 | tail -15

echo ""
echo "=== 5) teste query identica a /api/me, via pooler ==="
docker exec "$APIC" sh -c 'PGPASSWORD=Rafaebiel_01_Gmc psql -h supabase-pooler -p 6543 -U postgres.gmc -d postgres -c "SELECT id, nome FROM usuarios WHERE matricula_institucional = '"'"'23110145'"'"';"' 2>&1 | tail -10

echo ""
echo "=== FIM ==="
