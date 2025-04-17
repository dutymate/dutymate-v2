resource "aws_cloudwatch_log_group" "webserver_log_group" {
  name              = "/ecs/dutymate-webserver-service"
  retention_in_days = 7

  tags = {
    Name = "dutymate-webserver-log-group"
  }
}

resource "aws_cloudwatch_log_group" "appserver_log_group" {
  name              = "/ecs/dutymate-appserver-service"
  retention_in_days = 7

  tags = {
    Name = "dutymate-appserver-log-group"
  }
}
