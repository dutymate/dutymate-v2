resource "aws_wafv2_web_acl" "waf_web_acl" {
  name  = "dutymate-waf-web-acl"
  scope = "REGIONAL"

  default_action {
    block {}
  }

  rule {
    name     = "AllowKoreaOnlyRule"
    priority = 100

    action {
      allow {}
    }

    statement {
      geo_match_statement {
        country_codes = ["KR"]
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      sampled_requests_enabled   = true
      metric_name                = "AllowKoreaOnlyRule"
    }
  }

  rule {
    name     = "AnonymousIpListRule"
    priority = 200

    override_action {
      count {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAnonymousIpList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      sampled_requests_enabled   = true
      metric_name                = "AnonymousIpListRule"
    }
  }

  rule {
    name     = "RateLimitRule"
    priority = 300

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      sampled_requests_enabled   = true
      metric_name                = "RateLimitRule"
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    sampled_requests_enabled   = true
    metric_name                = "WebACLVisibilityConfig"
  }

  tags = {
    Name = "dutymate-waf-web-acl"
  }
}

resource "aws_wafv2_web_acl_association" "waf_external_alb_association" {
  resource_arn = var.external_alb_arn
  web_acl_arn  = aws_wafv2_web_acl.waf_web_acl.arn
}
