resource "aws_cloudwatch_event_connection" "api_connection" {
  name               = "dutymate-api-connection"
  authorization_type = "API_KEY"

  auth_parameters {
    api_key {
      key   = "X-API-KEY"
      value = var.api_secret_key
    }
  }
}

locals {
  api_configs = {
    delete_demo = {
      name        = "delete-demo",
      schedule    = "cron(0 * * * ? *)",
      http_method = "DELETE",
      endpoint    = "https://api.${var.domain_name}/api/member/demo"
    },
    refresh_news = {
      name        = "refresh-news",
      schedule    = "cron(0 21,5,12 * * ? *)",
      http_method = "PUT",
      endpoint    = "https://api.${var.domain_name}/api/news"
    },
    update_holiday = {
      name        = "update-holiday",
      schedule    = "cron(0 15 * * ? *)",
      http_method = "PUT",
      endpoint    = "https://api.${var.domain_name}/api/holiday/update"
    },
    login_log = {
      name        = "login-log",
      schedule    = "cron(5 15 * * ? *)",
      http_method = "POST",
      endpoint    = "https://api.${var.domain_name}/api/log/login"
    },
  }
}

resource "aws_cloudwatch_event_api_destination" "api_destinations" {
  for_each                         = local.api_configs
  name                             = "dutymate-destination-${each.value.name}"
  connection_arn                   = aws_cloudwatch_event_connection.api_connection.arn
  invocation_endpoint              = each.value.endpoint
  http_method                      = each.value.http_method
  invocation_rate_limit_per_second = 10
}

resource "aws_cloudwatch_event_rule" "api_rules" {
  for_each            = local.api_configs
  name                = each.value.name
  schedule_expression = each.value.schedule
}

resource "aws_cloudwatch_event_target" "api_targets" {
  for_each = local.api_configs
  rule     = aws_cloudwatch_event_rule.api_rules[each.key].name
  arn      = aws_cloudwatch_event_api_destination.api_destinations[each.key].arn
  role_arn = var.eventbridge_api_destinations_role_arn
}
