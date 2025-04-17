package net.dutymate.api.entity.community;

import java.sql.Timestamp;
import java.util.List;

import net.dutymate.api.entity.Member;
import net.dutymate.api.enumclass.Category;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Board {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long boardId;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "member_id", nullable = false)
	private Member member;

	@Column(length = 100)
	private String title;

	@Column(length = 2000)
	private String content;

	@Column(nullable = false, updatable = false)
	private Timestamp createdAt;

	@Enumerated(EnumType.STRING)
	private Category category;

	private String boardImageUrl;

	private Integer viewCnt;

	private Integer likesCntLow;
	private Integer likesCntMid;
	private Integer likesCntHigh;

	@OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Comment> commentList;

	@OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<BoardLikes> boardLikeList;

	@PrePersist
	protected void prePersist() {
		this.createdAt = new Timestamp(System.currentTimeMillis());
	}

	public void increaseViewCnt() {
		this.viewCnt++;
	}

	public void increaseLikeCnt(Integer grade) {
		if (grade < 4) { // 1, 2, 3년차
			this.likesCntLow++;
		} else if (grade < 8) { // 4, 5, 6, 7년차
			this.likesCntMid++;
		} else { // 8년차 이상
			this.likesCntHigh++;
		}
	}

	public void decreaseLikeCnt(Integer grade) {
		if (grade < 4) { // 1, 2, 3년차
			this.likesCntLow--;
		} else if (grade < 8) { // 4, 5, 6, 7년차
			this.likesCntMid--;
		} else { // 8년차 이상
			this.likesCntHigh--;
		}
	}

	public int getLikesCnt() {
		return likesCntLow + likesCntMid + likesCntHigh;
	}
}
