# Testing Log

## Perft Tests - Expected results calculated using Stockfish 16
Initial Perft tests of the move generation function.  
### Starting Position
FEN: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1  
  
**Depth: 1 Ply**  
Expected Result: 20 Nodes  
Observered Result: 20 Nodes  
Changes Made: None

**Depth: 2 Ply**  
Expected Result: 400 Nodes  
Observered Result: 400 Nodes  
Changes Made: None  
  
**Depth: 3 Ply**  
Expected Result: 8902 Nodes  
Observed Result: 8902 Nodes  
Changes Made: None
  
**Depth: 4 Ply**  
Expected Result: 1972781 Nodes  
Observed Result: 1924305 Nodes  
Changes Made: The value of captured pieces weren't being saved to the board's past game state stack, so captures weren't being unplayed correctly. The rank that a pawn needed to be on to be able to capture and promote was set to 6. (It should be 6 when white and 1 when black.)  

**Depth: 5 Ply**  
Expected Result: 4865609 Nodes  
Observed Result: 4865609 Nodes  
Changes Made: None   

**Depth: 6 Ply**  
Expected Result: 119060324 Nodes   
Observed Result: 119060324 Nodes  
Changes Made: None  

### Castling and Promotion
Reference [here](https://www.chessprogramming.org/Perft_Results)  
FEN: r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1  

**Depth: 1 Ply**  
Expected Result: 6 Nodes  
Observed Result: 6 Nodes  
Changes Made: None  

**Depth: 2 Ply**  
Expected Result: 264 Nodes  
Observed Result: 258 Nodes  
Changes Made: Accidental variable overwriting in castling  

**Depth: 3 Ply**  
Expected Result: 9467 Nodes  
Observed Result: 9461 Nodes  
Changes Made: Unable to promote to knight, instead the promotion moves had two rook promotions. As knights move less than rooks, there was less nodes.  

**Depth: 4 Ply**   
Expected Result: 422333 Nodes  
Observed Result: 422333 Nodes  
Changes Made: None

**Depth: 5 Ply**   
Expected Result: 15833292 Nodes  
Observed Result: 15834152 Nodes  
Changes Made: Queen-side castling could occur even if there was a piece on b1/b8

**Depth: 6 Ply**   
Expected Result: 706045033 Nodes  
Observed Result: 706045033 Nodes  
Changes Made: None  
  
### Castling and Promotion - Mirrored  
FEN: r2q1rk1/pP1p2pp/Q4n2/bbp1p3/Np6/1B3NBn/pPPP1PPP/R3K2R b KQ - 0 1   
**All results from depth 1-6 passed with same node count as unmirrored position**

### Endgame Pins
Reference [here](https://www.chessprogramming.org/Perft_Results)  
FEN: 8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -   
**All results from depth 1-7 passed**

### Talkchess Position
Reference [here](http://www.talkchess.com/forum3/viewtopic.php?t=42463)  
FEN: rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8  
**All results from depth 1-5 passed**
