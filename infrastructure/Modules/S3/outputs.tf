output "asset_bucket_arn" {
  value = aws_s3_bucket.asset_bucket.arn
}

output "frontend_bucket_regional_domain_name" {
  value = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
}
