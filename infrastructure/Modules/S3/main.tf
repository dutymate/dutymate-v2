resource "aws_s3_bucket" "asset_bucket" {
  bucket = "dutymate-bucket-${terraform.workspace}"

  tags = {
    Name = "dutymate-bucket-${terraform.workspace}"
  }
}

resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "dutymate-bucket-frontend"

  tags = {
    Name = "dutymate-bucket-frontend"
  }
}

resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "asset_public_access" {
  bucket = aws_s3_bucket.asset_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_public_access_block" "frontend_public_access" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "asset_bucket_policy" {
  bucket = aws_s3_bucket.asset_bucket.id

  depends_on = [
    aws_s3_bucket_public_access_block.asset_public_access
  ]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowPrivateWriteAccess"
        Effect    = "Allow"
        Principal = "*"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.asset_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "aws:SourceVpce" = "${var.vpce_s3_id}"
          }
        }
      },
      {
        Sid       = "AllowPublicReadAccess"
        Effect    = "Allow"
        Principal = "*"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.asset_bucket.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id

  depends_on = [
    aws_s3_bucket_public_access_block.frontend_public_access
  ]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "${var.cloudfront_distribution_arn}"
          }
        }
      }
    ]
  })
}
