data "aws_ami" "amazonlinux2" {
  owners      = ["amazon"]
  most_recent = true

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm*"]
  }
}

resource "aws_instance" "db_access_instance" {
  ami                         = data.aws_ami.amazonlinux2.id
  instance_type               = "t2.micro"
  subnet_id                   = var.database_subnets[0]
  associate_public_ip_address = false
  iam_instance_profile        = var.ssm_instance_profile_name
  vpc_security_group_ids      = [var.sg_ssm_ec2_id]

  tags = {
    Name = "dutymate-db-access-instance"
  }
}
