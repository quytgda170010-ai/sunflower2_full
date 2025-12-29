FROM alpine:3.18

# Install packages
RUN apk add --no-cache mysql-client bash tzdata

# Set Vietnam timezone
ENV TZ=Asia/Ho_Chi_Minh
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create backup directory
RUN mkdir -p /backups

COPY backup.sh /backup.sh
RUN chmod +x /backup.sh

CMD ["/backup.sh"]
