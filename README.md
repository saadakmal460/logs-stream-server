# Logs Stream Server

How to start the server

- Take pull
- Setup the .env

#### Inside the cluster folder
- Run docker-compose up -d
- docker exec -it kafka1 kafka-topics --create --topic logs --bootstrap-server kafka1:9092 --partitions 6 --replication-factor 3
- Server running at 3000
- Clickhouse at http://localhost:8123/
