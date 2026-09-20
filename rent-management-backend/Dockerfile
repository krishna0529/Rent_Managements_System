# ===============================================
# Spring Boot Backend Dockerfile
# ===============================================
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Create upload directory for documents & media
RUN mkdir -p /app/uploads

# Copy the pre-packaged Spring Boot JAR
COPY target/rent-management-backend-*.jar app.jar

# Expose server port
EXPOSE 8080

# Production performance flags
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
