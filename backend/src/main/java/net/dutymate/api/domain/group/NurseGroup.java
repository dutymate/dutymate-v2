package net.dutymate.api.domain.group;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

import net.dutymate.api.domain.group.dto.GroupUpdateRequestDto;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
public class NurseGroup {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long groupId;

	@Column(length = 30, nullable = false)
	private String groupName;

	@Column(length = 100)
	private String groupDescription;

	@Column(nullable = false, updatable = false)
	private Timestamp createdAt;

	private String groupImg;

	@OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
	@Builder.Default
	private List<GroupMember> groupMemberList = new ArrayList<>();

	@PrePersist
	public void prePersist() {

		this.createdAt = new Timestamp(System.currentTimeMillis());
	}

	public void addGroupMember(GroupMember groupMember) {
		groupMemberList.add(groupMember);
	}

	public void update(GroupUpdateRequestDto groupUpdateRequestDto) {
		this.groupName = groupUpdateRequestDto.getGroupName();
		this.groupDescription = groupUpdateRequestDto.getGroupDescription();
		this.groupImg = groupUpdateRequestDto.getGroupImg();
	}
}
