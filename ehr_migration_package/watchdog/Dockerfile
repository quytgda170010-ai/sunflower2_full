FROM alpine:3.18

# Install packages including tzdata for timezone support
RUN apk add --no-cache mysql-client bash curl tzdata

# Set Vietnam timezone
ENV TZ=Asia/Ho_Chi_Minh
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY watchdog.sh /watchdog.sh
RUN chmod +x /watchdog.sh

CMD ["/watchdog.sh"]
