import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import {
  arrayUnion,
  doc,
  updateDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import { v4 as uuid } from 'uuid';

import Attach from '../image/attach-svgrepo-com.svg';
import Img from '../image/image-add-fill-svgrepo-com.svg';

const Input = () => {
  const [text, setText] = useState('');
  const [img, setImg] = useState(null);

  const { currentUser } = useContext(AuthContext);
  const { data } = useContext(ChatContext);

  const handleSend = async () => {
    if (img) {
      const storageRef = ref(storage, uuid());

      const uploadTask = uploadBytesResumable(storageRef, img);

      uploadTask.on(
        error => {
          //setErr(true);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(async downloadURL => {
            await updateDoc(doc(db, 'chats', data.chatId), {
              messages: arrayUnion({
                id: uuid(),
                text,
                senderId: currentUser.uid,
                date: Timestamp.now(),
                img: downloadURL,
              }),
            });
          });
        }
      );
    } else {
      await updateDoc(doc(db, 'chats', data.chatId), {
        messages: arrayUnion({
          id: uuid(),
          text,
          senderId: currentUser.uid,
          date: Timestamp.now(),
        }),
      });
    }

    await updateDoc(doc(db, 'userChats', currentUser.uid), {
      [data.chatId + '.lastMessage']: {
        text,
      },
      [data.chatId + '.date']: serverTimestamp(),
    });

    await updateDoc(doc(db, 'userChats', data.user.uid), {
      [data.chatId + '.lastMessage']: {
        text,
      },
      [data.chatId + '.date']: serverTimestamp(),
    });

    setText('');
    setImg(null);
  };
  return (
    <div className='input'>
      <input
        type='text'
        placeholder='Type something...'
        onChange={e => setText(e.target.value)}
        value={text}
      />
      <div className='send'>
        <img src={Attach} alt='attach' />
        <input
          type='file'
          name='file'
          id='file'
          style={{ display: 'none' }}
          onChange={e => setImg(e.target.files[0])}
        />
        <label htmlFor='file'>
          <img src={Img} alt='images' />
        </label>
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default Input;
