package net.dutymate.api.entity.community;

import java.sql.Timestamp;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
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
public class HotBoard {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long hotBoardId;

	@OneToOne(optional = false)
	@JoinColumn(name = "board_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Board board;

	@Column(nullable = false, updatable = false)
	private Timestamp uploadAtHotBoard;

	@PrePersist
	protected void prePersist() {
		this.uploadAtHotBoard = new Timestamp(System.currentTimeMillis());
	}
}
