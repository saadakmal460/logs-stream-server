CREATE DATABASE IF NOT EXISTS logging;

CREATE TABLE logging.logs
(
    projectId String,
    correlationId String DEFAULT '',

    timestamp DateTime64(3) DEFAULT now64(3),

    level LowCardinality(String),
    component LowCardinality(String),

    message String CODEC(ZSTD),
    meta String CODEC(ZSTD),
    exception String CODEC(ZSTD),

    sessionStartedAt Nullable(DateTime64(3)),
    sessionEndedAt Nullable(DateTime64(3)),

    durationMs Nullable(UInt64),

    requestMethod LowCardinality(Nullable(String)),
    requestPath Nullable(String),
    statusCode Nullable(UInt16),

    INDEX idx_level level TYPE set(100) GRANULARITY 4,
    INDEX idx_status statusCode TYPE minmax GRANULARITY 4
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (projectId, timestamp)
TTL timestamp + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;

