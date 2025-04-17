package net.dutymate.api.comunity.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import net.dutymate.api.entity.Member;
import net.dutymate.api.entity.community.Comment;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
	boolean existsByCommentIdAndMember(Long commentId, Member member);
}
