import React from 'react';

import PlaylistContainer from '../../containers/Playlist/Playlist'

import styles from './Playlist.module.scss';


function Playlist() {
    return (
        <div className={styles.playlist}>
            <PlaylistContainer playlistId="sR5VypYk" />
        </div>
    );
}

export default Playlist;
