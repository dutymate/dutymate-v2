package net.dutymate.api.domain.community.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.global.entity.Member;
import net.dutymate.api.global.entity.community.Comment;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
	boolean existsByCommentIdAndMember(Long commentId, Member member);
}
