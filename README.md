# Easy Node CLI

**Introduction**

An easy and high customizable cli with pre-built features.

- [Getting Started](#getting-started)
    - [Installing for node projects](#installing-for-node-projects)
    - [Installing custom commands](#installing-custom-commands)
    - [Running custom commands](#running-custom-commands)
- [Custom Command](#custom-command)
    - [Class creation](#class-creation)
        - [Method creation](#method-creation)
        - [Parameter passing](#parameter-passing)
- [Built in commands](#built-in-commands)
    - [dir](src/command/dir/README.md)
    - [file](src/command/file/README.md)
    - [json](src/command/json/README.md)
    - [solid-js](src/command/solid-js)
        - [component](src/command/solid-js/component/README.md)

## Getting Started

### Installing for node projects
````bash
> npm i https://github.com/arian-arka/ecli
````

----

### Installing custom commands
````bash
> ecli command/generate path:command
````

----

### Running custom commands
running hello command
````bash
> ecli command/run !path:command !build !command:hello
````
Every other parameters will be sent off to the custom command

<h6>!path and !build and !command parameters are only for running<h6/>

----






## Custom Command

### Class creation

In you command path, navigate to src/command and create a file named custom.ts

````ts
import {Command} from "ecli/dist/src/class/Command";
import {basePath} from "ecli/dist/src/helper/path";

export default class custom extends Command {}
````

#### Method creation
Then create a class like this that extends Command
````ts
import {Command} from "ecli/dist/src/class/Command";
import {basePath} from "ecli/dist/src/helper/path";

export default class custom extends Command{
  index(args : any): any {
    console.log('index of custom! ',args);
    console.log('base',basePath());
  }

  argsType(props : {
    arg?:any,
    arg1:boolean,
    arg2:boolean,
    arg3:string,
    arg4:number,
    arg5:number,
  }) : any{
    console.log('arg :(',props.arg,') type:',typeof props.arg);
    console.log('arg1 :(',props.arg1,') type:',typeof props.arg1);
    console.log('arg2 :(',props.arg2,') type:',typeof props.arg2);
    console.log('arg3 :(',props.arg3,') type:',typeof props.arg3);
    console.log('arg4 :(',props.arg4,') type:',typeof props.arg4);
    console.log('arg5 :(',props.arg5,') type:',typeof props.arg5);

    return 'Return Value!!';
  }
}
````

Run the following command 
````bash
> ecli command/run !path:command !build !command:custom arg1 arg2: arg3:hi arg4:12 arg5:0.123
````
Default method is index, it will be executed when no method is acquired.

and the output must be something like
```
< return >
index of custom!  { arg1: true, arg2: false, arg3: 'hi', arg4: 12, arg5: 0.123 }
base [your base path]
```

Run the following command
````bash
> ecli command/run !path:command !build !command:custom:argsType arg1 arg2: arg3:hi arg4:12 arg5:0.123
````
Method argsType will be executed

and the output must be something like
```
< return >
arg :( undefined ) type: undefined
arg1 :( true ) type: boolean
arg2 :( false ) type: boolean
arg3 :( hi ) type: string
arg4 :( 12 ) type: number
arg5 :( 0.123 ) type: number
Return Value!!
```

#### Parameter passing
Look how parameters are passed in the previous example

Parameters and values are seperated with `:`

`trueVal` is equal to 
````ts
  const trueVal : boolean = true;
````
`falseVal:` is equal to
````ts
  const trueVal : boolean = false;
````
`stringVal:abcedf123` is equal to
````ts
  const stringVal : string = 'abcedf123';
````
`numberVal:123` is equal to
````ts
  const numberVal : number = 123;
````
----


Below is an explanation of each terminal mode from the list you provided, along with examples where applicable. These modes are part of the POSIX terminal interface (often manipulated via `stty` or termios in Unix-like systems) and control how a terminal (or pseudo-terminal, PTY) handles input, output, and signals. Since you’re using `ssh2` in Node.js, these modes are relevant to the behavior of the remote shell’s PTY, influencing issues like command echoing or control sequence output (e.g., `[?2004`).

I’ll group them into categories (e.g., character size, input, output, control) for clarity, explain their purpose, and provide examples of how they might affect your shell session or how to set them.

---

### Character Size Modes
These determine the number of bits per character.

1. **CS7 (7-bit mode)**
    - **Purpose**: Sets the terminal to use 7-bit characters, stripping the 8th bit (useful for older systems or ASCII-only communication).
    - **Example**: `stty cs7`
        - Input `0xFF` (binary `11111111`) becomes `0x7F` (`01111111`).
        - Rarely used today unless interfacing with legacy hardware.
    - **In `ssh2`**: Might reduce data size but could truncate modern UTF-8 characters.

2. **CS8 (8-bit mode)**
    - **Purpose**: Sets 8-bit characters, allowing full byte values (default for modern systems, supports UTF-8).
    - **Example**: `stty cs8`
        - Input `0xFF` is preserved as `0xFF`.
        - Typing `é` (UTF-8: `0xC3 0xA9`) works correctly.
    - **In `ssh2`**: Likely already enabled; ensures proper character handling.

---

### Echo-Related Modes
These control how input is displayed (or “echoed”) back to the terminal.

3. **ECHO (Enable echoing)**
    - **Purpose**: When enabled, characters typed are echoed to the screen.
    - **Example**: `stty echo`
        - Typing `ls -l` shows `ls -l` on screen, then the output.
    - **Disabled**: `stty -echo`
        - Typing `ls -l` runs silently; only output appears.
    - **In `ssh2`**: Likely why your `stdin` commands (e.g., `ls -l`) appear in `stdout`.

4. **ECHOCTL (Echo control characters as ^(Char))**
    - **Purpose**: Displays control characters (e.g., Ctrl+C) as `^C` instead of acting on them silently.
    - **Example**: `stty echoctl`
        - Pressing Ctrl+C shows `^C` before interrupting.
    - **Disabled**: `stty -echoctl`
        - Ctrl+C interrupts without display.

5. **ECHOE (Visually erase chars)**
    - **Purpose**: Backspace visually erases the previous character on screen.
    - **Example**: `stty echoe`
        - Typing `ls-<Backspace>` shows `ls` (visually removes `-`).
    - **Disabled**: `stty -echoe`
        - Backspace might just move the cursor, leaving `-` visible.

6. **ECHOKE (Visual erase for line kill)**
    - **Purpose**: When the kill character (e.g., Ctrl+U) is pressed, visually erases the entire line.
    - **Example**: `stty echoke`
        - Typing `ls -l` then Ctrl+U clears the line visually.
    - **Disabled**: `stty -echoke`
        - Line is discarded but not visually erased.

7. **ECHOK (Kill character discards current line)**
    - **Purpose**: The kill character (e.g., Ctrl+U) discards the current input line.
    - **Example**: `stty echok`
        - Typing `ls -l` then Ctrl+U discards it; new prompt appears.
    - **Disabled**: `stty -echok` (less common).

8. **ECHONL (Echo NL even if ECHO is off)**
    - **Purpose**: Echoes newline (`\n`) even when `ECHO` is disabled.
    - **Example**: `stty -echo echonl`
        - Typing `ls -l<Enter>` shows only a blank line, then output.
    - **Disabled**: `stty -echonl`
        - No newline echo if `ECHO` is off.

---

### Input Processing Modes
These affect how input is processed before being sent to the program.

9. **ICANON (Canonicalize input lines)**
    - **Purpose**: Enables line-buffered input; input is sent only after a newline.
    - **Example**: `stty icanon`
        - Typing `ls -l` requires Enter to execute.
    - **Disabled**: `stty -icanon`
        - Each keypress (e.g., `l`, `s`) is sent immediately.

10. **ICRNL (Map CR to NL on input)**
    - **Purpose**: Converts carriage return (`\r`, Ctrl+M) to newline (`\n`).
    - **Example**: `stty icrnl`
        - Pressing Enter (sends `\r`) becomes `\n`.
    - **Disabled**: `stty -icrnl`
        - `\r` stays as `\r`, potentially breaking line-based commands.

11. **IEXTEN (Enable extensions)**
    - **Purpose**: Enables extended input processing (e.g., `VLNEXT`, `VWERASE`).
    - **Example**: `stty iexten`
        - Allows Ctrl+V to quote special characters (see `VLNEXT`).
    - **Disabled**: `stty -iexten`
        - Disables features like literal next character.

12. **IGNCR (Ignore CR on input)**
    - **Purpose**: Ignores carriage return (`\r`) characters entirely.
    - **Example**: `stty igncr`
        - Pressing Enter (`\r`) does nothing; requires `\n`.
    - **Disabled**: `stty -igncr`
        - `\r` is processed normally.

13. **IGNPAR (Ignore parity errors)**
    - **Purpose**: Ignores characters with parity errors (if parity checking is enabled).
    - **Example**: `stty ignpar`
        - Corrupted byte `0xFF` with bad parity is discarded.
    - **Disabled**: `stty -ignpar`
        - Parity errors might trigger `PARMRK`.

14. **IMAXBEL (Ring bell on input queue full)**
    - **Purpose**: Rings the terminal bell when the input buffer is full.
    - **Example**: `stty imaxbel`
        - Typing rapidly might beep if buffer overflows.
    - **Disabled**: `stty -imaxbel`
        - Silently discards excess input.

15. **INLCR (Map NL to CR on input)**
    - **Purpose**: Converts newline (`\n`) to carriage return (`\r`).
    - **Example**: `stty inlcr`
        - Pressing Enter (sends `\n`) becomes `\r`.
    - **Disabled**: `stty -inlcr`
        - `\n` stays as `\n`.

16. **INPCK (Enable checking of parity errors)**
    - **Purpose**: Enables parity checking on input (requires `PARENB`).
    - **Example**: `stty inpck parenb`
        - Bad parity bytes might be marked or ignored.
    - **Disabled**: `stty -inpck`
        - No parity checks.

17. **ISIG (Enable signals INTR, QUIT, [D]SUSP)**
    - **Purpose**: Enables signal-generating characters (e.g., Ctrl+C for SIGINT).
    - **Example**: `stty isig`
        - Ctrl+C sends SIGINT, interrupting the program.
    - **Disabled**: `stty -isig`
        - Ctrl+C is treated as regular input.

18. **ISTRIP (Strip 8th bit off characters)**
    - **Purpose**: Strips the 8th bit, reducing characters to 7 bits.
    - **Example**: `stty istrip`
        - `0xFF` becomes `0x7F`.
    - **Disabled**: `stty -istrip`
        - Full 8-bit characters preserved.

19. **IUCLC (Translate uppercase to lowercase)**
    - **Purpose**: Converts uppercase input to lowercase.
    - **Example**: `stty iuclc`
        - Typing `LS -L` becomes `ls -l`.
    - **Disabled**: `stty -iuclc`
        - Case preserved.

---

### Flow Control Modes
These manage input/output flow.

20. **IXANY (Any char will restart after stop)**
    - **Purpose**: Allows any character to resume output after a stop (not just `VSTART`).
    - **Example**: `stty ixany`
        - After Ctrl+S (stop), any key resumes.
    - **Disabled**: `stty -ixany`
        - Only `VSTART` (e.g., Ctrl+Q) resumes.

21. **IXOFF (Enable input flow control)**
    - **Purpose**: Enables software flow control for input (sends stop/start to sender).
    - **Example**: `stty ixoff`
        - Terminal sends Ctrl+S/Ctrl+Q to pause/resume incoming data.
    - **Disabled**: `stty -ixoff`
        - No input flow control.

22. **IXON (Enable output flow control)**
    - **Purpose**: Enables software flow control for output (responds to stop/start).
    - **Example**: `stty ixon`
        - Ctrl+S pauses output; Ctrl+Q resumes.
    - **Disabled**: `stty -ixon`
        - Ignores Ctrl+S/Ctrl+Q.

---

### Output Processing Modes
These affect how output is formatted.

23. **NOFLSH (Don’t flush after interrupt)**
    - **Purpose**: Prevents flushing input/output queues after signals (e.g., Ctrl+C).
    - **Example**: `stty noflsh`
        - Ctrl+C interrupts but keeps pending input.
    - **Disabled**: `stty -noflsh`
        - Flushes queues on interrupt.

24. **OCRNL (Translate CR to NL on output)**
    - **Purpose**: Converts carriage return (`\r`) to newline (`\n`) on output.
    - **Example**: `stty ocrnl`
        - `echo -e "line\r"` outputs `line\n`.
    - **Disabled**: `stty -ocrnl`
        - `\r` stays as `\r`.

25. **OLCUC (Convert lowercase to uppercase)**
    - **Purpose**: Converts lowercase output to uppercase.
    - **Example**: `stty olcuc`
        - `echo "hello"` outputs `HELLO`.
    - **Disabled**: `stty -olcuc`
        - Case preserved.

26. **ONLCR (Map NL to CR-NL)**
    - **Purpose**: Converts newline (`\n`) to carriage return-newline (`\r\n`).
    - **Example**: `stty onlcr`
        - `echo "line"` outputs `line\r\n`.
    - **Disabled**: `stty -onlcr`
        - `\n` stays as `\n`.

27. **ONLRET (Newline performs a carriage return)**
    - **Purpose**: Makes newline (`\n`) also move the cursor to the start of the line.
    - **Example**: `stty onlret`
        - `echo "line"` moves cursor to start of next line.
    - **Disabled**: `stty -onlret`
        - `\n` only moves down.

28. **ONOCR (Translate NL to CR-NL on output)**
    - **Purpose**: Prevents carriage return at column 0.
    - **Example**: `stty onocr`
        - Avoids extra `\r` at line start.
    - **Disabled**: `stty -onocr`
        - Allows `\r` at column 0.

29. **OPOST (Enable output processing)**
    - **Purpose**: Enables output processing (e.g., `ONLCR`, `OLCUC`).
    - **Example**: `stty opost`
        - Applies all output transformations.
    - **Disabled**: `stty -opost`
        - Raw output, no transformations.

---

### Parity Modes
These handle parity checking for serial communication.

30. **PARENB (Parity enable)**
    - **Purpose**: Enables parity generation/checking.
    - **Example**: `stty parenb`
        - Adds parity bit to each byte.
    - **Disabled**: `stty -parenb`
        - No parity.

31. **PARMRK (Mark parity and framing errors)**
    - **Purpose**: Marks parity errors with special bytes (e.g., `\377\0`).
    - **Example**: `stty parmrk`
        - Bad parity byte becomes `\377\0x`.
    - **Disabled**: `stty -parmrk`
        - Errors ignored or discarded.

32. **PARODD (Odd parity, else even)**
    - **Purpose**: Sets odd parity if enabled; otherwise, even parity.
    - **Example**: `stty parodd parenb`
        - Odd number of 1s in byte + parity bit.
    - **Disabled**: `stty -parodd`
        - Even parity.

---

### Miscellaneous Modes
These handle special behaviors.

33. **PENDIN (Retype pending input)**
    - **Purpose**: Redisplays pending input after certain changes.
    - **Example**: `stty pendin`
        - After Ctrl+C, retypes unprocessed input.
    - **Disabled**: `stty -pendin`.

34. **TOSTOP (Stop background jobs from output)**
    - **Purpose**: Stops background jobs if they try to write to the terminal.
    - **Example**: `stty tostop`
        - `echo "hi" &` stops until foregrounded.
    - **Disabled**: `stty -tostop`
        - Background jobs can write.

35. **XCASE (Uppercase with backslash)**
    - **Purpose**: Enables legacy uppercase mode with `\` prefix for lowercase.
    - **Example**: `stty xcase iuclc olcuc`
        - Typing `\a` outputs `A`.
    - **Disabled**: `stty -xcase`
        - Normal case handling.

---

### Baud Rate Settings
These set communication speed (less relevant for SSH but part of termios).

36. **TTY_OP_ISPEED (Input baud rate)**
    - **Purpose**: Sets input speed in bits per second.
    - **Example**: `stty 9600`
        - Sets input to 9600 bps.

37. **TTY_OP_OSPEED (Output baud rate)**
    - **Purpose**: Sets output speed.
    - **Example**: `stty 9600`
        - Sets output to 9600 bps.

---

### Special Characters (V* Settings)
These define control characters for specific actions (default values vary by system).

38. **VDISCARD (Toggle flushing of output)**
    - **Example**: `stty discard ^O`
        - Ctrl+O discards output buffer.

39. **VDSUSP (Another suspend character)**
    - **Example**: `stty dsusp ^Y`
        - Ctrl+Y suspends (delayed).

40. **VEOF (End-of-file character)**
    - **Example**: `stty eof ^D`
        - Ctrl+D sends EOF.

41. **VEOL (End-of-line character)**
    - **Example**: `stty eol ^J`
        - Ctrl+J acts as additional newline.

42. **VEOL2 (Additional end-of-line)**
    - **Example**: `stty eol2 ^M`
        - Ctrl+M as extra EOL.

43. **VERASE (Erase character)**
    - **Example**: `stty erase ^H`
        - Backspace deletes last char.

44. **VFLUSH (Flush output)**
    - **Example**: `stty flush ^O`
        - Ctrl+O flushes output.

45. **VINTR (Interrupt character)**
    - **Example**: `stty intr ^C`
        - Ctrl+C sends SIGINT.

46. **VKILL (Kill current line)**
    - **Example**: `stty kill ^U`
        - Ctrl+U discards line.

47. **VLNEXT (Literal next character)**
    - **Example**: `stty lnext ^V`
        - Ctrl+V then Ctrl+C sends literal `^C`.

48. **VQUIT (Quit character)**
    - **Example**: `stty quit ^\`
        - Ctrl+\ sends SIGQUIT.

49. **VREPRINT (Reprint input line)**
    - **Example**: `stty reprint ^R`
        - Ctrl+R redisplays line.

50. **VSTART (Resume output)**
    - **Example**: `stty start ^Q`
        - Ctrl+Q resumes after stop.

51. **VSTATUS (Print status)**
    - **Example**: `stty status ^T`
        - Ctrl+T shows system status.

52. **VSTOP (Pause output)**
    - **Example**: `stty stop ^S`
        - Ctrl+S pauses output.

53. **VSUSP (Suspend program)**
    - **Example**: `stty susp ^Z`
        - Ctrl+Z suspends.

54. **VSWTCH (Switch shell layer)**
    - **Example**: Rarely used; depends on system.

55. **VWERASE (Erase word)**
    - **Example**: `stty werase ^W`
        - Ctrl+W erases previous word.

---

### Applying to Your `ssh2` Issue
- **Echoing Commands**: `ECHO` being enabled causes your `ls -l` to appear in `stdout`. Disabling it (`stty -echo`) didn’t work, possibly due to PTY persistence or shell overrides.
- **Control Sequences**: Modes like `[?2004h` (Bracketed Paste) are DEC modes sent by the shell, unrelated to these `stty` settings but part of the PTY’s terminal emulation.
- **Fix**: Filter output as shown earlier:
  ```javascript
  stream.on('data', (data) => {
    let output = data.toString().replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '').trim();
    if (output && !output.startsWith('ls -l')) console.log('STDOUT: ' + output);
  });
  ```

Let me know if you need examples tailored to your specific `ssh2` setup!

