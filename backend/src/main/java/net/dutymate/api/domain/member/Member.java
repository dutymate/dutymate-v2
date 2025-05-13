package net.dutymate.api.domain.member;

import java.sql.Timestamp;
import java.util.List;

import org.mindrot.jbcrypt.BCrypt;

import net.dutymate.api.domain.calendar.Calendar;
import net.dutymate.api.domain.color.Color;
import net.dutymate.api.domain.common.utils.YearMonth;
import net.dutymate.api.domain.community.Board;
import net.dutymate.api.domain.community.BoardLikes;
import net.dutymate.api.domain.community.Comment;
import net.dutymate.api.domain.group.GroupMember;
import net.dutymate.api.domain.member.util.StringGenerator;
import net.dutymate.api.domain.wardmember.Role;
import net.dutymate.api.domain.wardmember.WardMember;

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
import lombok.Setter;

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

	@Setter
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

	@Column(nullable = false)
	private Boolean isVerified;

	@Setter
	@OneToOne(mappedBy = "member", cascade = CascadeType.ALL)
	private WardMember wardMember;

	@OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Board> boardList;

	@OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Comment> commentList;

	@OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<BoardLikes> boardLikesList;

	@Column(nullable = false)
	private Integer autoGenCnt;

	private Integer enterYear;

	private Integer enterMonth;

	@OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<GroupMember> groupMemberList;

	@Setter
	@OneToOne(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
	private Color color;

	@OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Calendar> calendarList;


	// 멤버 초기값 설정 (닉네임, 생성시각, 활성화여부)
	@PrePersist
	public void prePersist() {
		this.nickname = StringGenerator.generateNickname();
		this.createdAt = new Timestamp(System.currentTimeMillis());
		this.isActive = true;
		this.isVerified = true;        // 신규 회원은 이메일 인증된 상태로 간주
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

	public void linkMember(Member tempMember) {
		this.gender = tempMember.getGender();
		this.role = tempMember.getRole();
		this.grade = tempMember.getGrade();
	}

	public void updateVerifiedEmail(String email) {
		this.email = email;
		this.isVerified = true;
	}

	public void updateAutoGenCnt(int changeNum) {
		this.autoGenCnt = this.autoGenCnt + changeNum;
	}

	public void setAutoGenCnt(int autoGenCnt) {
		this.autoGenCnt = autoGenCnt;
	}

	public void changeEnterYearMonth(YearMonth yearMonth) {
		this.enterYear = yearMonth.year();
		this.enterMonth = yearMonth.month();
	}

	public void clearEnterDate() {
		this.enterYear = null;
		this.enterMonth = null;
	}

	public YearMonth enterYearMonth() {
		return new YearMonth(this.enterYear, this.enterMonth);
	}
}
