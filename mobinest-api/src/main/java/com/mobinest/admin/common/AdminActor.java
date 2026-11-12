package com.mobinest.admin.common;

/** The admin performing a change (recorded in the order timeline and the audit log). */
public record AdminActor(String clerkUserId, String displayName) {}
