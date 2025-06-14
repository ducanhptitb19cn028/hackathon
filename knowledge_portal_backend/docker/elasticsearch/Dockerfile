FROM docker.elastic.co/elasticsearch/elasticsearch:7.9.3

# Switch to root to make changes
USER root

# Copy custom Elasticsearch configuration
COPY elasticsearch.yml /usr/share/elasticsearch/config/elasticsearch.yml

# Create data directory with proper permissions
RUN mkdir -p /usr/share/elasticsearch/data && \
    chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/data && \
    chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/config && \
    chmod -R 755 /usr/share/elasticsearch/data

# Set environment variables
ENV discovery.type=single-node \
    ES_JAVA_OPTS="-Xms512m -Xmx512m" \
    xpack.security.enabled=false

# Switch back to elasticsearch user
USER elasticsearch

# Expose port
EXPOSE 9200 