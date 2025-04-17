package net.dutymate.api.entity;

import java.sql.Timestamp;
import java.util.List;

import org.mindrot.jbcrypt.BCrypt;

import net.dutymate.api.entity.community.Board;
import net.dutymate.api.entity.community.BoardLikes;
import net.dutymate.api.entity.community.Comment;
import net.dutymate.api.enumclass.Gender;
import net.dutymate.api.enumclass.Provider;
import net.dutymate.api.enumclass.Role;
import net.dutymate.api.member.util.NicknameGenerator;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
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
public class Member {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long memberId;

	@Column(length = 45, nullable = false)
	private String email;

	@Column(nullable = false)
	private String password;

	@Column(length = 20, nullable = false)
	private String name;

	@Column(length = 20, nullable = false)
	private String nickname;

	@Enumerated(EnumType.STRING)
	private Gender gender;

	@Enumerated(EnumType.STRING)
	private Role role;

	private Integer grade;

	@Enumerated(EnumType.STRING)
	private Provider provider;

	private String profileImg;

	@Column(nullable = false, updatable = false)
	private Timestamp createdAt;

	@Column(columnDefinition = "tinyint(1)", nullable = false)
	private Boolean isActive;

	@OneToOne(mappedBy = "member", cascade = CascadeType.ALL)
	private WardMember wardMember;

	@OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Board> boardList;

	@OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Comment> commentList;

	@OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<BoardLikes> boardLikesList;

	// 멤버 초기값 설정 (닉네임, 생성시각, 활성화여부)
	@PrePersist
	public void prePersist() {
		this.nickname = NicknameGenerator.generateNickname();
		this.createdAt = new Timestamp(System.currentTimeMillis());
		this.isActive = true;
	}

	public void changeAdditionalInfo(Integer grade, Gender gender, Role role) {
		this.grade = grade;
		this.gender = gender;
		this.role = role;
	}

	public void updateRole(Role role) {
		this.role = role;
	}

	public void editMember(String name, String nickname, String gender, Integer grade) {
		this.name = name;
		this.nickname = nickname;
		this.gender = Gender.valueOf(gender);
		this.grade = grade;
	}

	public void setFileUrl(String fileUrl) {
		this.profileImg = fileUrl;
	}

	public void changeTempMember(String name, Gender gender, Integer grade) {
		if (name != null && !name.isEmpty()) {
			this.name = name;
		}
		if (gender != null) {
			this.gender = gender;
		}
		if (grade != null && grade > 0) {
			this.grade = grade;
		}
	}

	public void updatePassword(String newPassword) {
		this.password = BCrypt.hashpw(newPassword, BCrypt.gensalt());
	}

	public void linkMember(Member enterMember) {
		this.email = enterMember.getEmail();
		this.password = enterMember.getPassword();
		this.name = enterMember.getName();
		this.nickname = enterMember.getNickname();
		this.gender = enterMember.getGender();
		this.role = enterMember.getRole();
		this.grade = enterMember.getGrade();
		this.provider = enterMember.getProvider();
		this.profileImg = enterMember.getProfileImg();
	}
}
