FROM nousresearch/hermes-agent:latest

WORKDIR /opt/data

EXPOSE 8642

CMD ["gateway", "run"]