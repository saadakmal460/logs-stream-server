CREATE DATABASE IF NOT EXISTS logging;

CREATE TABLE logging.logs
(
    projectId String,
    correlationId String DEFAULT '',

    timestamp DateTime64(3),

    level LowCardinality(String),
    message String,
    component LowCardinality(String),

    meta String,
    exception String,

    sessionStartedAt Nullable(DateTime64(3)),
    sessionEndedAt Nullable(DateTime64(3)),

    durationMs Nullable(UInt64),

    requestMethod Nullable(String),
    requestPath Nullable(String),
    statusCode Nullable(UInt16)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (projectId, timestamp, correlationId)
SETTINGS index_granularity = 8192;


CREATE TABLE logging.logs_kafka
(
    projectId String,
    correlationId String,

    timestamp DateTime64(3),

    level String,
    message String,
    component String,

    meta String,
    exception String,

    sessionStartedAt Nullable(DateTime64(3)),
    sessionEndedAt Nullable(DateTime64(3)),

    durationMs Nullable(UInt64),

    requestMethod Nullable(String),
    requestPath Nullable(String),
    statusCode Nullable(UInt16)
)
ENGINE = Kafka
SETTINGS
    kafka_broker_list = 'kafka1:9092,kafka2:9092,kafka3:9092',
    kafka_topic_list = 'logs',
    kafka_group_name = 'clickhouse_logs',
    kafka_format = 'JSONEachRow',
    kafka_num_consumers = 6;

CREATE MATERIALIZED VIEW logging.logs_mv
TO logging.logs
AS
SELECT
    projectId,
    correlationId,
    timestamp,
    level,
    message,
    component,
    meta,
    exception,
    sessionStartedAt,
    sessionEndedAt,
    durationMs,
    requestMethod,
    requestPath,
    statusCode
FROM logging.logs_kafka;

