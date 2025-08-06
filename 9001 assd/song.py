'''
Zunwei zhang
zzha0118
540320428
USYD CODE CITATION ACKNOWLEDGEMENT
This file contains acknowledgements of code
'''
from __future__ import annotations
class Song:

    def __init__(self, name: str, artist: str, genre: str, duration: str):
        '''
        Initialises a Song objecy given an artist name, a song genre, 
        and song duration.

        @Attributes:
        - song_name: The name of the song
        - artist: The name of the song's artist
        - genre: The genre of the song
        - duration: The duration of the song in seconds converted from mm:ss

        @Parameters:
        - name (str): The name of the song.
        - artist (str): The name of the artist who performed or composed the song.
        - genre (str): The genre of the song (e.g., pop, rock, classical).
        - duration (str): The duration of the song in a string format, typically in 
                        the form of 'minutes:seconds' (e.g., '03:45').

        '''
        self.song_name = name
        self.artist = artist
        self.genre = genre
        self.set_duration(duration)

        pass

    def get_name(self) -> str:
        '''
        Returns the name of the song
        '''
        return self.song_name
        pass
    
    def get_artist(self) -> str:
        '''
        Returns artist of the song
        '''
        return self.artist
        pass
    

    
    def get_genre(self) -> str:
        '''
        Returns the value of the instance attribute `genre`.
        '''
        return self.genre
        pass

    
    def set_duration(self, duration: str) -> None:
        '''
        Converts the given song's duration to seconds
        And sets the duration of the song.

        @Parameters:
        - duration (str): The duration of the song in string format mm:ss.

        '''
        minutes, seconds = [int(x) for x in duration.split(':')] 
        self.duration = minutes * 60 + seconds
        pass

    
    def get_duration(self) -> int:
        '''
        Returns the duration of the song in seconds.
        '''
        return self.duration
        pass

    
    def is_same(self, check_song: Song) -> bool:
        '''
        Checks whether two Song objects are identical.
        If their name and artist are the same, returns True.
        Otherwise, returns False.

        @parameters:
        - check_song (Song): The Song object to compare with.

        '''
        return self.song_name == check_song.song_name and self.artist == check_song.artist
        pass

    
    def has_same_artist(self, check_song: Song) -> bool:
        '''
        Checks whether two Song objects have the same artist.
        If their attribute artist are identical, returns True.
        Otherwise, returns False.

        @parameters:
        - check_song (Song): The Song object to compare with.
        '''
        return self.artist == check_song.artist
        pass

    
    def has_same_genre(self, check_song: Song) -> bool:
        '''
        Checks whether two Song objects have the same genre.
        If their attribute genre are identical, returns True.
        Otherwise, returns False.

        @parameters:
        - check_song(Song): The Song object to compare with.
        '''
        return self.genre == check_song.genre
        pass


    def get_longest(self, check_song: Song) -> Song | None:
        '''
        Compares the durations of two Song objects
        Returns the one with the longer duration.

        @parameters:
        - check_song(Song): The Song object to compare with.
        '''
        if self.duration > check_song.duration:
            return self
        elif self.duration < check_song.duration:
            return check_song
        else:
            return None
        pass

if __name__ == '__main__':
    song1 = Song("Song Donda", "Artist KanyeWest", "HipHop", "01:00")
    song2 = Song("Song Donda", "Artist KanyeEast", "HipHop", "01:00")
    # add any test code here