package com.mobinest.admin.audit;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.mobinest.admin.common.AdminActor;
import com.mobinest.admin.common.AdminPaging;
import com.mobinest.admin.common.Params;
import com.mobinest.common.web.PageResponse;

import lombok.RequiredArgsConstructor;

/** Writes and reads the admin audit log. Writes join the caller's transaction (all or nothing). */
@Service
@RequiredArgsConstructor
public class AuditService {

    private static final int MAX_DETAILS = 1000;

    private final AdminAuditRepository repo;

    public record AuditEntry(Long id, Instant at, String actorId, String actor, String action,
            String entityType, String entityId, String details) {}

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(AdminActor actor, String action, String entityType, String entityId, String details) {
        AdminAuditLog log = new AdminAuditLog();
        log.setActorClerkUserId(actor.clerkUserId());
        log.setActorName(actor.displayName());
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDetails(details == null || details.length() <= MAX_DETAILS ? details : details.substring(0, MAX_DETAILS));
        repo.save(log);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditEntry> search(String entityType, String entityId, String q,
            Integer page, Integer size, String sort) {
        Specification<AdminAuditLog> spec = (root, query, cb) -> cb.conjunction();
        String type = Params.blankToNull(entityType);
        if (type != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("entityType"), type.toUpperCase(Locale.ROOT)));
        }
        String id = Params.blankToNull(entityId);
        if (id != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("entityId"), id));
        }
        String text = Params.blankToNull(q);
        if (text != null) {
            String like = Params.likeContains(text);
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("entityId")), like, '\\'),
                cb.like(cb.lower(root.get("actorName")), like, '\\'),
                cb.like(cb.lower(root.get("details")), like, '\\'),
                cb.like(cb.lower(root.get("action")), like, '\\')));
        }
        var pageable = AdminPaging.of(page, size, sort, Map.of("createdAt", "createdAt", "action", "action"),
            Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id")));
        return PageResponse.of(repo.findAll(spec, pageable), a -> new AuditEntry(a.getId(), a.getCreatedAt(),
            a.getActorClerkUserId(), a.getActorName(), a.getAction(), a.getEntityType(), a.getEntityId(), a.getDetails()));
    }
}
