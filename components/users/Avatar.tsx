import React from "react";
import styles from "./Avatar.module.css";
import Image from "next/image";

/**
 * This file shows how to add live avatars like you can see them at the top right of a Google Doc or a Figma file.
 * https://liveblocks.io/docs/examples/live-avatars
 *
 * The users avatar and name are not set via the `useMyPresence` hook like the cursors.
 * They are set from the authentication endpoint.
 *
 * See pages/api/liveblocks-auth.ts and https://liveblocks.io/docs/api-reference/liveblocks-node#authorize for more information
 */

const IMAGE_SIZE = 48;

export function Avatar({ name, otherStyles }: { otherStyles: string; name: string }) {
    return (
        <div className={`${styles.avatar} ${otherStyles} h-9 w-9`} data-tooltip={name}>
            <Image
                src={`https://liveblocks.io/avatars/avatar-${Math.floor(Math.random() * 30)}.png`}
                fill
                className={styles.avatar_picture}
                alt={name}
            />
        </div>
    );
}