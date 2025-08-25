#!/bin/bash

# SiNusa Quick Start Script
# This script sets up the SiNusa application for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Docker and Docker Compose
check_docker() {
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        print_status "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        print_status "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi

    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi

    print_success "Docker and Docker Compose are available"
}

# Function to check Node.js
check_nodejs() {
    if ! command_exists node; then
        print_warning "Node.js is not installed. Installing Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi

    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION is available"
}

# Function to create environment file
setup_environment() {
    print_status "Setting up environment configuration..."

    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend/.env file"
    else
        print_warning "backend/.env already exists, skipping..."
    fi

    # Create necessary directories
    mkdir -p logs uploads
    print_success "Created logs and uploads directories"
}

# Function to build and start services
start_services() {
    print_status "Building and starting services..."

    # Build images
    docker-compose build

    # Start services
    docker-compose up -d

    print_success "Services started successfully"
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."

    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL..."
    until docker-compose exec -T postgres pg_isready -U sinusa_user -d sinusa_db; do
        sleep 2
    done
    print_success "PostgreSQL is ready"

    # Wait for Redis
    print_status "Waiting for Redis..."
    until docker-compose exec -T redis redis-cli ping; do
        sleep 2
    done
    print_success "Redis is ready"

    # Wait for backend
    print_status "Waiting for backend API..."
    until curl -f http://localhost:3000/health >/dev/null 2>&1; do
        sleep 5
    done
    print_success "Backend API is ready"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."

    # Wait a bit more for the backend to be fully ready
    sleep 10

    # Run migrations
    docker-compose exec backend npm run migrate

    print_success "Database migrations completed"
}

# Function to seed initial data
seed_data() {
    print_status "Seeding initial data..."

    # Run seeds
    docker-compose exec backend npm run seed

    print_success "Initial data seeded"
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    docker-compose ps

    echo ""
    print_status "Service URLs:"
    echo "  Backend API: http://localhost:3000"
    echo "  Web Portal:  http://localhost:3001"
    echo "  API Docs:    http://localhost:3000/api/v1/docs"
    echo "  Health Check: http://localhost:3000/health"
    echo ""
    echo "  Database Admin: http://localhost:8080"
    echo "  Redis Admin:    http://localhost:8081"
    echo "  Email Testing:  http://localhost:8025"
    echo ""
}

# Function to show next steps
show_next_steps() {
    echo ""
    print_success "🎉 SiNusa is now running!"
    echo ""
    print_status "Next steps:"
    echo "1. Open http://localhost:3001 in your browser"
    echo "2. Register a new account or use the default admin account"
    echo "3. Explore the API documentation at http://localhost:3000/api/v1/docs"
    echo ""
    print_status "Useful commands:"
    echo "  View logs:        docker-compose logs -f"
    echo "  Stop services:    docker-compose down"
    echo "  Restart services: docker-compose restart"
    echo "  Update services:  docker-compose pull && docker-compose up -d"
    echo ""
    print_status "For more information, see:"
    echo "  Documentation: docs/"
    echo "  API Docs: docs/API_DOCUMENTATION.md"
    echo "  Deployment: docs/DEPLOYMENT_GUIDE.md"
    echo ""
}

# Function to create default admin user
create_admin_user() {
    print_status "Creating default admin user..."

    # Check if admin user already exists
    if docker-compose exec backend node -e "
        const { UserModel } = require('./dist/models/user');
        const { UserRole } = require('./dist/middleware/auth');
        
        UserModel.query()
            .where('role', UserRole.SUPER_ADMIN)
            .first()
            .then(user => {
                if (user) {
                    console.log('Admin user already exists');
                    process.exit(0);
                } else {
                    console.log('Creating admin user...');
                    process.exit(1);
                }
            })
            .catch(err => {
                console.error('Error checking admin user:', err);
                process.exit(1);
            });
    " >/dev/null 2>&1; then
        print_warning "Admin user already exists, skipping..."
        return
    fi

    # Create admin user
    docker-compose exec backend node -e "
        const bcrypt = require('bcryptjs');
        const { UserModel } = require('./dist/models/user');
        const { UserRole } = require('./dist/middleware/auth');
        const { v4: uuidv4 } = require('uuid');
        
        const hashedPassword = bcrypt.hashSync('admin123', 12);
        
        UserModel.query().insert({
            id: uuidv4(),
            email: 'admin@sinusa.com',
            password: hashedPassword,
            name: 'Super Admin',
            role: UserRole.SUPER_ADMIN,
            email_verified: true,
            is_active: true
        }).then(() => {
            console.log('Admin user created successfully');
            console.log('Email: admin@sinusa.com');
            console.log('Password: admin123');
        }).catch(err => {
            console.error('Error creating admin user:', err);
        });
    "

    print_success "Default admin user created"
    echo "  Email: admin@sinusa.com"
    echo "  Password: admin123"
    echo ""
    print_warning "Please change the default password after first login!"
}

# Main execution
main() {
    echo ""
    echo "🚀 SiNusa Quick Start Script"
    echo "=============================="
    echo ""

    # Check prerequisites
    print_status "Checking prerequisites..."
    check_docker
    check_nodejs

    # Setup environment
    setup_environment

    # Start services
    start_services

    # Wait for services
    wait_for_services

    # Run migrations
    run_migrations

    # Seed data
    seed_data

    # Create admin user
    create_admin_user

    # Show status
    show_status

    # Show next steps
    show_next_steps
}

# Handle script arguments
case "${1:-}" in
    "stop")
        print_status "Stopping SiNusa services..."
        docker-compose down
        print_success "Services stopped"
        ;;
    "restart")
        print_status "Restarting SiNusa services..."
        docker-compose restart
        print_success "Services restarted"
        ;;
    "logs")
        print_status "Showing service logs..."
        docker-compose logs -f
        ;;
    "status")
        show_status
        ;;
    "clean")
        print_warning "This will remove all data and containers!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Cleaning up..."
            docker-compose down -v
            docker system prune -f
            print_success "Cleanup completed"
        else
            print_status "Cleanup cancelled"
        fi
        ;;
    "help"|"-h"|"--help")
        echo "SiNusa Quick Start Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Start SiNusa services"
        echo "  stop       Stop all services"
        echo "  restart    Restart all services"
        echo "  logs       Show service logs"
        echo "  status     Show service status"
        echo "  clean      Remove all data and containers"
        echo "  help       Show this help message"
        echo ""
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac