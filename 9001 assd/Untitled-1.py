'''
Zunwei zhang
zzha0118
540320428
USYD CODE CITATION ACKNOWLEDGEMENT
This file contains acknowledgements of code
'''

from song import Song
import sys



def load_song_from_input(input_song: str) -> Song:
    '''
    Parse the input song and extract all song's information
    Create a Song object based on that

    @parameters:
    - input_song(str): The string that contains the song information

    @returns:
    - Song: The Song object that contains song's information
    '''
 
        # Split the input string into details 
    details = input_song.split(',')
    song_name = details[1]
    artist = details[2]
    genre = details[3]
    duration = details[4]
    return Song(song_name, artist, genre, duration)
 
def add_song(queue: list[Songs], song: Song)-> None:
    '''
    Adds a song to the queue if the user chooses to add.
    Error/successful messages will be printed inside this function.

    Checks if a song with the same name and artist already exists in the queue.
    If it does, it prints a message indicating the song is already present.
    Otherwise, it adds the song to the queue and 
    prints a message indicating successful addition.

    @parameters:
    - queue (list[Song]): The list of Song objects representing the queue.
    - song (Song): The Song object to be added to the queue.

    '''
       # Check if song have existed already in the queue
    same_song = False
    for qs in queue:
        if (song.song_name == qs.song_name and song.artist == qs.artist):
            same_song = True
            break
    if same_song :
        print(f'***\'{song.song_name}\' by {song.artist} is already in the queue***')
    #if doesn't exist, APPEND
    else :
        queue.append(song)
        print(f'***\'{song.song_name}\' by {song.artist} is added to the queue***')
  

def write_queue(filename: str, queue: list[Song], queue_mode: str)-> None:
    '''
    Writes all Song objects stored in the queue variable 
    to the output file in the queue_info directory. 
    The file-open mode depends on the selected queue mode:
        - CREATE: Create a new file to store the queue.
        - RESET: Overwrite the contents of the file.
        - APPEND: Write the new queue below the old queue.
    Each song in the queue is written as a single line in the output file. 

    The format of each line:
    <song name>,<artist>,<genre>,<song duration>

    @parameters:
    - filename (str): file to write the queue into.
    - queue (list[Song]): A list of Song object that inside the queue
    - queue_mode(str): the mode of the queue (RESET/APPEND/CREATE)
    '''
    #recognize the file-open mode
    if queue_mode.upper() == 'CREATE' or queue_mode.upper() == 'RESET':
        mode = 'w' # replace the content
    elif queue_mode.upper() == 'APPEND':
        mode = 'a' # appent to the end 
    else:
        print('Invalid queue_mode!')
        return
    #write queue songs into filename
    with open(filename,mode) as file:
        for song in queue:
            minute = song.duration//60
            seconds = song.duration % 60 #transfer duration to 'mm:ss'
            file.write(f'{song.song_name},{song.artist},{song.genre},{minute:02}:{seconds:02}\n')


def main():
    '''
    Where your main program will run
    '''
    # Check the command line arguments input
    if len(sys.argv) == 1:
        print('No <username> found!')
        return
    username = sys.argv[1]
    filename = f'queue_info/{username}_queue.txt'
    # A list temporarily stores all Song objects in the queue
    queue = list()
    ### SELECTING QUEUE MODE ###
    # Check if queue already exists
    try:
        with open(f'queue_info/{username}_queue.txt','r') as file:
            while True:
                mode = input('Do you want to reset or append to your queue? ')
                if mode.upper() == 'RESET':
                    print('Resetting your queue...')
                    print()
                    queue_mode = 'RESET'
                    break
                elif mode.upper() == 'APPEND':
                    print('Appending to your queue...')
                    print()
                    queue_mode = 'APPEND'
                    break
                else:
                    print('Invalid mode!')
    except FileNotFoundError:
        # File does not exist, create new queue
        print(f'No queue for {username} found! Creating a new queue...')
        print()
        queue_mode = 'CREATE'
    ### INPUT SONG ###
    # Prompt for song's details
    while True:
        input_song = input('Update songs in the queue: ')
        if input_song == 'END QUEUE':
            break
        else:
            # Verify whether the argument for <operation> is valid
            split = input_song.strip().split(',')
            if split[0] != 'A':
                print('***Invalid operation!***')
                print()
                continue
            else:
                song = load_song_from_input(input_song)
                add_song(queue, song)
                print()
    # Write to the output file
    write_queue(filename, queue, queue_mode)
    



def load_song_from_input(input_song: str) -> Song:
    '''
    Parse the input song and extract all song's information
    Create a Song object based on that

    @parameters:
    - input_song(str): The string that contains the song information

    @returns:
    - Song: The Song object that contains song's information
    '''
    #split the input_song(str) and extract song's imformation
    imformation = input_song.split(',')
    song_name = imformation[1]
    artist = imformation[2]
    genre = imformation[3]
    duration = imformation[4]
    return Song(song_name, artist, genre, duration)

def add_song(queue: list[Songs], song: Song)-> None:
    '''
    Adds a song to the queue if the user chooses to add.
    Error/successful messages will be printed inside this function.

    Checks if a song with the same name and artist already exists in the queue.
    If it does, it prints a message indicating the song is already present.
    Otherwise, it adds the song to the queue and 
    prints a message indicating successful addition.

    @parameters:
    - queue (list[Song]): The list of Song objects representing the queue.
    - song (Song): The Song object to be added to the queue.


    '''
    # Iterate over the queue to check if the song already exists
    same_song = False
    for qs in queue:
        if (song.song_name == qs.song_name and song.artist == qs.artist):
            same_song = True
            break
    if same_song :
        print(f'***\'{song.song_name}\' by {song.artist} is already in the queue***')
    #if it doesn't exist, then APPEND
    else :
        queue.append(song)
        print(f'***\'{song.song_name}\' by {song.artist} is added to the queue***')
    

def remove_song(queue: list[Songs], song: Song)-> None:
    '''
    Removes a song from the queue if it exists.
    Error/successful messages will be printed inside this function.
    
    Checks if a song exists in the queue.
    If it does, remove it from the queue and prints a successful message.
    Otherwise, prints a corresponding error message.

    @parameters:
    - queue (list[Song]): The list of Song objects representing the queue.
    - song (Song): The Song object to be removed from the queue.
    '''


    for qs in queue:
        # to find  same songs and remove them
        if (song.song_name == qs.song_name and qs.artist == song.artist):
            queue.remove(qs)
            print(f'***Successfully removed \'{song.song_name}\' by {song.artist}***')
            return
    print(f'***No \'{song.song_name}\' by {song.artist} found, cannot remove it***')

def replace_song(queue: list[Songs], song: Song, position: str) -> None:
    '''
    Swaps a song in the queue with another song at a specified position.
    Error/successful messages will be printed inside this function.

    Checks if the provided position is valid. 
    If valid, it removes the song exisiting at that position and replaces it with specified song 
    and prints a message indicating successful swap. 
    Otherwise, it prints an error message depending 
    on the error (not integer, negative, or out of range).

    @parameters:
    - queue (list[Song]): The list of Song objects representing the queue.
    - song (Song): The Song object to be moved into the queue.
    - position (str): The position of the song to be swapped (zero-based indexing).
    '''
    #check the validation of position and replace
    try:
        int_pos = int(position)#position is string
        if int_pos < 0:
            print('***Position must be at least 0***')
            return
        elif int_pos >= len(queue):
            print('***The specified position is out of range of the queue***')    
            return
        pre_song = queue[int_pos]
        queue[int_pos] = song
        print(f'***Successfully replaced \'{pre_song.song_name}\' by {pre_song.artist}\
 to \'{song.song_name}\' by {song.artist}***')
    except ValueError:
        print('***Position must be an integer***')

def write_queue(filename: str, queue: list[Song], queue_mode: str)-> None:
    '''
    Writes all Song objects stored in the queue variable to the output file in the queue_info directory. 
    The file-open mode depends on the selected queue mode:
        - CREATE: Create a new file to store the queue.
        - RESET: Overwrite the contents of the file.
        - APPEND: Write the new queue below the old queue.
    Each song in the queue is written as a single line in the output file. 

    The format of each line:
    <song name>,<artist>,<genre>,<song duration>

    @parameters:
    - queue (list[Song]): A list of Song object that inside the queue
    - queue_mode(str): the mode of the queue (RESET/APPEND/CREATE)
    '''
    #recognize the file-open mode
    if queue_mode.upper() == 'CREATE' or queue_mode.upper() == 'RESET':
        mode = 'w' # replace the content
    elif queue_mode.upper() == 'APPEND':
        mode = 'a' # appent to the end 
    else:
        print('Invalid queue_mode!')
        return
    #write queue songs into filename
    with open(filename,mode) as file:
        for song in queue:
            minute = song.duration//60
            seconds = song.duration % 60 #transfer duration to 'mm:ss'
            file.write(f'{song.song_name},{song.artist},{song.genre},{minute:02}:{seconds:02}\n')

def main():
    '''
    Where your main program will run
    '''
    #check the command line arguments input
    if len(sys.argv) == 1:
        print('No <username> found!')
        return
    username = sys.argv[1]
    filename = f'queue_info/{username}_queue.txt'
    # A list temporarily stores all Song object in the queue
    queue = list()

    ### SELECTING QUEUE MODE ###
    # Check if queue already exists
    # Check for RESET mode
    # Check for APPEND mode
    try:
        with open(f'queue_info/{username}_queue.txt','r') as file:
            while True:
                mode = input('Do you want to reset or append to your queue? ')
                if mode.upper() == 'RESET':
                    print('Resetting your queue...')
                    print()
                    queue_mode = 'RESET'
                    break
                elif mode.upper() == 'APPEND':
                    print('Appending to your queue...')
                    print()
                    queue_mode = 'APPEND'
                    break
                else:
                    print('Invalid mode!')
    #If queue are not exist,CREAT
    except FileNotFoundError:
        print(f'No queue for {username} found! Creating a new queue...')
        print()
        queue_mode = 'CREATE'

    ### INPUT SONG
    # Prompt for details of details
    # Verify whether the argument for <operation> is valid
    # Performing add, remove, swap depends on the specified argument
    while True:
        input_song = input('Update songs in the queue: ')
        if input_song == 'END QUEUE':
            break
        #split input_song and check, if it's Invalid, prompt a new input
        else:
            split = input_song.strip().split(',')
            if split[0] not in ['A','R','S']:
                print('***Invalid operation!***')
                print()
                continue
            elif split[0] == 'A':
                song = load_song_from_input(input_song)
                add_song(queue,song)
                print()
            elif split[0] == 'R':
                song = load_song_from_input(input_song)
                remove_song(queue,song)
                print()
            elif  split[0] == 'S':
                song = load_song_from_input(input_song)
                position = input('Which position do you want to replace this song with? ')
                replace_song(queue,song,position)
                print()  
                  
    # Write to the output file
    write_queue(filename,queue,queue_mode)

if __name__ == "__main__":
    main()