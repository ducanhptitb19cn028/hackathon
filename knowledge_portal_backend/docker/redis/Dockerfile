FROM redis:7-alpine

# Copy custom Redis configuration
COPY redis.conf /usr/local/etc/redis/redis.conf

# Set proper permissions
RUN chown redis:redis /usr/local/etc/redis/redis.conf

# Use custom configuration
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"] 