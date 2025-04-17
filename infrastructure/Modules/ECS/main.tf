resource "aws_ecs_cluster" "webserver_ecs_cluster" {
  name = "dutymate-webserver-ecs-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "dutymate-webserver-ecs-cluster"
  }
}

resource "aws_ecs_cluster" "appserver_ecs_cluster" {
  name = "dutymate-appserver-ecs-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "dutymate-appserver-ecs-cluster"
  }
}

resource "aws_ecs_task_definition" "webserver_ecs_task_definition" {
  family             = "dutymate-webserver-ecs-task"
  network_mode       = "awsvpc"
  execution_role_arn = var.ecs_task_execution_role_arn
  task_role_arn      = var.webserver_ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "webserver-container",
      image     = "nginx:latest",
      memory    = 768,
      cpu       = 512,
      essential = true,
      portMappings = [
        {
          containerPort = 80,
          protocol      = "tcp"
        }
      ],
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          "awslogs-group"         = "${var.webserver_log_group_name}",
          "awslogs-region"        = "${var.aws_region}",
          "awslogs-stream-prefix" = "web"
        }
      },
      command = [
        "/bin/sh",
        "-c",
        join("\n", [
          "cat <<'EOF' > /etc/nginx/nginx.conf",
          "events {}",
          "",
          "http {",
          "    server {",
          "        listen 80;",
          "",
          "        location / {",
          "            proxy_pass http://${var.internal_alb_dns_name}:8080;",
          "            proxy_set_header Host $host;",
          "            proxy_set_header X-Real-IP $remote_addr;",
          "            proxy_intercept_errors off;",
          "        }",
          "    }",
          "}",
          "EOF",
          "nginx -g 'daemon off;'"
        ])
      ]
    }
  ])

  tags = {
    Name = "dutymate-webserver-ecs-task"
  }
}

resource "aws_ecs_task_definition" "appserver_ecs_task_definition" {
  family             = "dutymate-appserver-ecs-task"
  network_mode       = "awsvpc"
  execution_role_arn = var.ecs_task_execution_role_arn
  task_role_arn      = var.appserver_ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "appserver-container",
      image     = "${var.ecr_repository_url}:latest",
      memory    = 768,
      cpu       = 512,
      essential = true,
      portMappings = [{
        containerPort = 8080,
        protocol      = "tcp"
      }],
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          "awslogs-group"         = "${var.appserver_log_group_name}",
          "awslogs-region"        = "${var.aws_region}",
          "awslogs-stream-prefix" = "app"
        }
      },
      environmentFiles = [
        {
          value = "${var.asset_bucket_arn}/environments/.env",
          type  = "s3"
        }
      ]
    }
  ])

  tags = {
    Name = "dutymate-appserver-ecs-task"
  }
}

resource "aws_ecs_service" "webserver_ecs_service" {
  name                               = "dutymate-webserver-service"
  cluster                            = aws_ecs_cluster.webserver_ecs_cluster.id
  task_definition                    = aws_ecs_task_definition.webserver_ecs_task_definition.arn
  desired_count                      = 2
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 100

  load_balancer {
    target_group_arn = var.external_alb_target_group_arn
    container_port   = 80
    container_name   = "webserver-container"
  }

  network_configuration {
    subnets         = var.public_subnets
    security_groups = [var.sg_webserver_ecs_id]
  }
}

resource "aws_ecs_service" "appserver_ecs_service" {
  name                               = "dutymate-appserver-service"
  cluster                            = aws_ecs_cluster.appserver_ecs_cluster.id
  task_definition                    = aws_ecs_task_definition.appserver_ecs_task_definition.arn
  desired_count                      = 2
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 100

  load_balancer {
    target_group_arn = var.internal_alb_target_group_arn
    container_port   = 8080
    container_name   = "appserver-container"
  }

  network_configuration {
    subnets         = var.private_subnets
    security_groups = [var.sg_appserver_ecs_id]
  }
}

data "aws_ssm_parameter" "ecs_ami" {
  name = "/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id"
}

resource "aws_launch_template" "webserver_ecs_launch_template" {
  name                   = "dutymate-webserver-ecs-launch-template"
  image_id               = data.aws_ssm_parameter.ecs_ami.value
  instance_type          = "t2.micro"
  vpc_security_group_ids = [var.sg_webserver_ecs_id]

  iam_instance_profile {
    name = var.ecs_instance_profile_name
  }

  instance_market_options {
    market_type = "spot"
  }

  user_data = base64encode(<<EOF
#!/bin/bash
echo ECS_CLUSTER=${aws_ecs_cluster.webserver_ecs_cluster.name} >> /etc/ecs/ecs.config
EOF
  )
}

resource "aws_launch_template" "appserver_ecs_launch_template" {
  name                   = "dutymate-appserver-ecs-launch-template"
  image_id               = data.aws_ssm_parameter.ecs_ami.value
  instance_type          = "t2.micro"
  vpc_security_group_ids = [var.sg_appserver_ecs_id]

  iam_instance_profile {
    name = var.ecs_instance_profile_name
  }

  instance_market_options {
    market_type = "spot"
  }

  user_data = base64encode(<<EOF
#!/bin/bash
echo ECS_CLUSTER=${aws_ecs_cluster.appserver_ecs_cluster.name} >> /etc/ecs/ecs.config
EOF
  )
}

resource "aws_autoscaling_group" "webserver_ecs_asg" {
  name                  = "dutymate-webserver-ecs-asg"
  max_size              = 3
  min_size              = 1
  desired_capacity      = 2
  vpc_zone_identifier   = var.public_subnets
  health_check_type     = "EC2"
  protect_from_scale_in = true

  launch_template {
    id      = aws_launch_template.webserver_ecs_launch_template.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
  }

  lifecycle {
    create_before_destroy = true
  }

  tag {
    key                 = "Name"
    value               = "dutymate-webserver-ecs-asg"
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_group" "appserver_ecs_asg" {
  name                  = "dutymate-appserver-ecs-asg"
  max_size              = 3
  min_size              = 1
  desired_capacity      = 2
  vpc_zone_identifier   = var.private_subnets
  health_check_type     = "EC2"
  protect_from_scale_in = true

  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupPendingInstances",
    "GroupStandbyInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances"
  ]

  launch_template {
    id      = aws_launch_template.appserver_ecs_launch_template.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
  }

  lifecycle {
    create_before_destroy = true
  }

  tag {
    key                 = "Name"
    value               = "dutymate-appserver-ecs-asg"
    propagate_at_launch = true
  }
}

resource "aws_ecs_capacity_provider" "webserver_capacity_provider" {
  name = "dutymate-webserver-capacity-provider"

  auto_scaling_group_provider {
    auto_scaling_group_arn         = aws_autoscaling_group.webserver_ecs_asg.arn
    managed_termination_protection = "ENABLED"

    managed_scaling {
      maximum_scaling_step_size = 5
      minimum_scaling_step_size = 1
      status                    = "ENABLED"
      target_capacity           = 100
    }
  }

  tags = {
    Name = "dutymate-webserver-capacity-provider"
  }
}

resource "aws_ecs_capacity_provider" "appserver_capacity_provider" {
  name = "dutymate-appserver-capacity-provider"

  auto_scaling_group_provider {
    auto_scaling_group_arn         = aws_autoscaling_group.appserver_ecs_asg.arn
    managed_termination_protection = "ENABLED"

    managed_scaling {
      maximum_scaling_step_size = 5
      minimum_scaling_step_size = 1
      status                    = "ENABLED"
      target_capacity           = 100
    }
  }

  tags = {
    Name = "dutymate-appserver-capacity-provider"
  }
}

resource "aws_ecs_cluster_capacity_providers" "webserver_capacity_provider_association" {
  cluster_name       = aws_ecs_cluster.webserver_ecs_cluster.name
  capacity_providers = [aws_ecs_capacity_provider.webserver_capacity_provider.name]
}

resource "aws_ecs_cluster_capacity_providers" "appserver_capacity_provider_association" {
  cluster_name       = aws_ecs_cluster.appserver_ecs_cluster.name
  capacity_providers = [aws_ecs_capacity_provider.appserver_capacity_provider.name]
}
