resource "aws_security_group" "sg_external_alb" {
  name   = "dutymate-sg-external-alb"
  vpc_id = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = var.public_subnet_cidr_block
  }

  tags = {
    Name = "dutymate-sg-external-alb"
  }
}

resource "aws_security_group" "sg_internal_alb" {
  name   = "dutymate-sg-internal-alb"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.sg_webserver_ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = var.private_subnet_cidr_block
  }

  tags = {
    Name = "dutymate-sg-internal-alb"
  }
}

resource "aws_security_group" "sg_webserver_ecs" {
  name   = "dutymate-sg-webserver-ecs"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.sg_external_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "dutymate-sg-webserver-ecs"
  }
}

resource "aws_security_group" "sg_appserver_ecs" {
  name   = "dutymate-sg-appserver-ecs"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.sg_internal_alb.id]
  }

  egress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = var.database_subnet_cidr_block
  }

  egress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = var.database_subnet_cidr_block
  }

  egress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = var.database_subnet_cidr_block
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "dutymate-sg-appserver-ecs"
  }
}

resource "aws_security_group" "sg_mysql" {
  name   = "dutymate-sg-mysql"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.sg_appserver_ecs.id, aws_security_group.sg_ssm_ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = {
    Name = "dutymate-sg-mysql"
  }
}

resource "aws_security_group" "sg_valkey" {
  name   = "dutymate-sg-valkey"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.sg_appserver_ecs.id, aws_security_group.sg_ssm_ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = {
    Name = "dutymate-sg-valkey"
  }
}

resource "aws_security_group" "sg_mongodb" {
  name   = "dutymate-sg-mongodb"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.sg_appserver_ecs.id, aws_security_group.sg_ssm_ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = {
    Name = "dutymate-sg-mongodb"
  }
}

resource "aws_security_group" "sg_ssm_ec2" {
  name   = "dutymate-sg-ssm-ec2"
  vpc_id = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "dutymate-sg-ssm-ec2"
  }
}

resource "aws_security_group" "sg_vpce_ecr" {
  name   = "dutymate-sg-vpce-ecr"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.sg_appserver_ecs.id]
  }

  tags = {
    Name = "dutymate-sg-vpce-ecr"
  }
}

resource "aws_security_group" "sg_vpce_ssm" {
  name   = "dutymate-sg-ssm"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.sg_ssm_ec2.id]
  }

  tags = {
    Name = "dutymate-sg-vpce-ssm"
  }
}
