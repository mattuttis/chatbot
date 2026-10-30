# Chatbot backend

Spring Boot service that streams Claude replies over Server-Sent Events.

## Run locally

Requires Java 21 and an API key from console.anthropic.com.

```
export ANTHROPIC_API_KEY=<your key>
mvn spring-boot:run
```

## Try it

```
curl -N -X POST localhost:8080/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Say hello"}'
```

## Test

`mvn verify` runs the tests with Claude mocked, so it needs no API key.
