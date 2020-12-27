DC-BASE = docker-compose.yml
DC-DB-BASE = docker-compose.database.yml
DC-CLEARGLASS = docker-compose.clearglass.yml

database: 
	docker-compose -f $(DC-DB-BASE) $(cmd)

clearglass-api:
	docker-compose -f $(DC-BASE) -f $(DC-CLEARGLASS) $(cmd)
