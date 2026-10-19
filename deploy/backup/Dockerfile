# Ежедневные резервные копии базы и фото. Как пользоваться — README.md рядом.
FROM postgres:17

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Расписание (03:00) и даты в именах файлов — по времени Алматы.
ENV TZ=Asia/Almaty

COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

ENTRYPOINT ["/usr/local/bin/backup.sh"]
