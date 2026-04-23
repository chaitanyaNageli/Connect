import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
const BASE_URL = "https://connect-prxn.onrender.com";
const socket = io(BASE_URL);

export default function Home({ number, setLogin }) {
    const [screen, setScreen] = useState("chats");
    const [showMenuOptions, setShowMenuOptions] = useState(false);
    const [menuOptions] = useState(["Add Chat", "Profile", "log out"]);
    const [searchedItem, setSearchedItem] = useState("");
    const [users, setUsers] = useState([]);
    const [newNumber, setNewNumber] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [selectedUser, setSelectedUser] = useState("");
    const [allMessages, setAllMessages] = useState([]);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [inputMsg, setInputMsg] = useState("");
    const chatRef = useRef(null);
    const bottomRef = useRef(null);
    const [file, setFile] = useState("");
    const [otherPic, setOtherPic] = useState("");
    const [showProfile, setShowProfile] = useState("");
    const [showLogout, setShowLogout] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowMenuOptions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleScroll = () => {
        const el = chatRef.current;
        if (!el) return;

        const threshold = 100;

        const isBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

        setIsAtBottom(isBottom);
    };
    useEffect(() => {
        if (isAtBottom) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [allMessages, isAtBottom]);

    const filteredSearchData = users.filter(user =>
        (user.number || "").includes(searchedItem.toLocaleLowerCase())
    )
    function handleMenuOptions() {
        setShowMenuOptions(prev => !prev);
    };


    function handleChat(user) {
        setSelectedUser(user.number);
        fetchMessages(user.number);
        setOtherPic(user.profilePic);
        setScreen("chat");
        setShowMenuOptions(false);
    }


    function setMenu(item) {
        switch (item) {
            case "Add Chat":
                setScreen("Add Chat");
                break;
            case "Profile":
                setScreen("Profile");
                break;
            case "log out":
                setShowLogout(prev => !prev);
                break;

            default:
                setScreen("chats");
                setErrorMsg("");
                break;
        }
        setShowMenuOptions(false);
    }
    const sendUserNumber = async () => {
        if (!newNumber.trim()) return;
        try {
            const response = await fetch(`${BASE_URL}/addUser`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sender: number,
                    receiver: newNumber
                })
            });
            const msg = await response.json();
            setNewNumber("");
            setErrorMsg(msg.msg);
            console.log(msg);
            await getUsersList();
        }
        catch (error) {
            console.log(error);

        }
    }

    const getUsersList = async () => {
        try {
            const response = await fetch(`${BASE_URL}/users/${number}`);
            const final_data = await response.json();
            console.log(final_data);
            setUsers(final_data);
        }
        catch (error) {
            console.log(error);
        }
    };
    useEffect(() => {
        getUsersList();
    }, [getUsersList])



    const sendMessages = async () => {
        if (!inputMsg.trim()) return;
        try {
            const messageDetails = {
                sender: number,
                receiver: selectedUser,
                text: inputMsg
            }
            socket.emit("message", messageDetails);
            setInputMsg("");

        }
        catch (error) {
            console.log(error);
        }
    }
    useEffect(() => {
        socket.on("ackOfMSG", (data) => {
            console.log("New message:", data);
        });
        socket.on("recievedMSG", (data) => {
            const date = new Date();
            setAllMessages(prev => [...prev, {
                _id: Math.random(),
                ...data,
                createdAt: date,
                fullDate: date.toDateString(),
                time: date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                })
            }]);
        });
        return () => {
            socket.removeAllListeners();
        }
    }, []);

    const fetchMessages = async (user) => {
        try {
            const res = await fetch(`${BASE_URL}/fetchMessages/${number}/${user}`);
            const data = await res.json();
            const formatted = data.map(msg => {
                const d = new Date(msg.createdAt);

                return {
                    ...msg,
                    fullDate: d.toDateString(),
                    time: d.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                    })
                };
            });

            setAllMessages(formatted);

            console.log(data);
        }
        catch (error) {
            console.log(error);
        }
    };

    const updateProfile = async () => {
        if (!file) return;

        const formdata = new FormData();
        formdata.append("file", file);
        formdata.append("number", number);

        try {
            const res = await fetch(`${BASE_URL}/uploadProfile`, {
                method: "POST",
                body: formdata
            });

            const data = await res.json();

            setShowProfile(data.url);
            setFile(null);
            getUsersList();
            getProfile();

        } catch (err) {
            console.log(err);
        }
    };

    const getProfile = async () => {
        try {
            const res = await fetch(`${BASE_URL}/profilepic/${number}`);
            const data = await res.json();

            setShowProfile(data);


        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getProfile();
    }, [getProfile]);
    return (
        <div className="cantainer">

            {screen === "chats" && (
                <div>
                    <div className="home-div1">
                        <h1 className="app-name">Connect</h1>
                        <p className="menu" onClick={handleMenuOptions}>...</p>

                        {showMenuOptions && (
                            <nav className="options" ref={containerRef}>
                                {menuOptions.map(item => (
                                    <p key={item} onClick={() => setMenu(item)}>{item}</p>
                                ))}
                            </nav>
                        )}

                    </div>

                    <input
                        className="search"
                        value={searchedItem}
                        onChange={(e) => setSearchedItem(e.target.value)} />

                    {(searchedItem ? filteredSearchData : users).map(user => (
                        <div className="user" key={user.number} onClick={() => handleChat(user)} >
                            <img
                                src={user.profilePic || "/default-profile.png"}
                                onError={(e) => (e.target.src = "/default-profile.png")}
                                className="profile-pic"
                                alt="profile"
                            />
                            <p>{user.number}</p>
                        </div>
                    ))}
                    {
                        showLogout && (
                            <div className="dialougeBox">
                                <p>Do you want to log out?</p>
                                <div className="dialogueOption">
                                    <p onClick={setLogin(false)} className="yes">Yes,log out</p>
                                    <p onClick={() => setShowLogout(false)} className="no">No</p>
                                </div>
                            </div>
                        )
                    }



                </div>
            )}


            {screen === "Add Chat" &&
                (<div className="addchat">
                    <div className="add-chat-div1">
                        <img src="back.png"
                            className="back"
                            alt="back"
                            onClick={() => setScreen("chats")} />
                        <p>Add Chat</p>
                    </div>
                    <div className="add-chat-div2">
                        <input
                            type="text"
                            value={newNumber}
                            placeholder={errorMsg || "enter new number"}
                            onChange={(e) => setNewNumber(e.target.value)} />
                        <button onClick={sendUserNumber}
                            className="addChat-button"
                        > submit </button>
                    </div>
                </div>)
            }


            {screen === "chat" && (
                <div>
                    <div className="user-chat">
                        <img src="back.png" className="back" onClick={() => setScreen("chats")} alt="back" />
                        <img
                            src={otherPic || "/default-profile.png"}
                            alt={"No Profile"}
                            onError={(e) => (e.target.src = "/default-profile.png")}
                            className="profile-pic"
                        />
                        <p>{selectedUser}</p>
                    </div>

                    <div className="chat-history" ref={chatRef} onScroll={handleScroll}>
                        {allMessages.map((msg, index) => {
                            const showDate =
                                index === 0 ||
                                msg.fullDate !== allMessages[index - 1].fullDate;

                            return (
                                <div key={msg._id}>
                                    {showDate && (
                                        <div className="date-separator">
                                            <p className="fullDate">{msg.fullDate}</p>
                                        </div>
                                    )}

                                    <div className={msg.sender === number ? "sender" : "receiver"}>
                                        <p className="text-msg">
                                            {msg.text}
                                            <span className="date">{msg.time}</span>
                                        </p>
                                    </div>
                                </div>
                            );
                        })}


                        <div ref={bottomRef}></div>
                    </div>

                    <div className="msgs">
                        <input value={inputMsg} className="msg-input" onChange={(e) => setInputMsg(e.target.value)} />
                        <img src="send.png" className="send-msg" onClick={sendMessages} alt="send" />
                    </div>
                </div>
            )}
            {screen === "Profile" && (
                <div className="profile">
                    <div className="profile-div1">
                        <img src="back.png"
                            className="back"
                            alt="back"
                            onClick={() => setScreen("chats")} />
                        <p>Profile</p>
                    </div>
                    <div className="profile-div2">
                        <img
                            src={file ? URL.createObjectURL(file) : (showProfile || "/default-profile.png")}
                            onError={(e) => (e.target.src = "/default-profile.png")}
                            className="profile-show"
                            alt="profile"
                        />

                        <input type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="profile-input"
                        />

                        <button
                            className="upload-button"
                            onClick={updateProfile}>Upload</button>
                    </div>
                </div>
            )}




        </div>
    );
}
