output "appserver_log_group_name" {
  value = aws_cloudwatch_log_group.appserver_log_group.name
}

output "webserver_log_group_name" {
  value = aws_cloudwatch_log_group.webserver_log_group.name
}
