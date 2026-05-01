# ADR-005: Managed Hugging Face Inference

## Status
Accepted

## Decision
Use Hugging Face managed endpoints for ASR and extraction-compatible model calls.

## Rationale
Managed inference keeps compute operations off the core app tier while preserving open-source model flexibility.
