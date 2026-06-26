.PHONY: up down build logs shell lint install clean

# Variables
DOCKER_COMPOSE = docker-compose

up:
	@echo "Starting SmartSupply platform..."
	$(DOCKER_COMPOSE) up -d

down:
	@echo "Stopping SmartSupply platform..."
	$(DOCKER_COMPOSE) down

build:
	@echo "Rebuilding Docker images..."
	$(DOCKER_COMPOSE) build --no-cache

logs:
	@echo "Tailing logs..."
	$(DOCKER_COMPOSE) logs -f

shell:
	@echo "Opening shell in frontend container..."
	$(DOCKER_COMPOSE) exec frontend sh

lint:
	@echo "Running linter locally..."
	cd frontend && npm run lint

install:
	@echo "Installing dependencies locally..."
	cd frontend && npm install

clean:
	@echo "Cleaning up Docker resources..."
	$(DOCKER_COMPOSE) down -v --remove-orphans
	docker system prune -f
