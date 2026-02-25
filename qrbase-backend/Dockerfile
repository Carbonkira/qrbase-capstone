FROM php:8.2-fpm

# Install ALL system dependencies in one single step
RUN apt-get update && apt-get install -y \
    git curl zip unzip libpng-dev libjpeg-dev libfreetype6-dev libonig-dev libxml2-dev libzip-dev

# Configure GD and install ALL PHP extensions in one single step
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd mbstring bcmath pdo_mysql exif pcntl zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY . .

# Install dependencies defined in your composer.json
RUN composer install --no-dev --optimize-autoloader

# Set permissions for Laravel storage
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Expose the port Render provides
CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT
