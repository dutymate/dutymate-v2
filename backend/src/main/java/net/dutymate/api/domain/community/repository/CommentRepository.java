package net.dutymate.api.domain.community.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.domain.community.Comment;
import net.dutymate.api.domain.member.Member;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
	boolean existsByCommentIdAndMember(Long commentId, Member member);
}
