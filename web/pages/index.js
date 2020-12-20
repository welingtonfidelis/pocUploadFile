import { useState } from 'react'
import { io } from 'socket.io-client';

let socket = null;
let sliceSize = 100000;
const defaultImage = 'assets/images/folder-plus-solid.svg';

export default function Home() {
  const [file, setFile] = useState(null);
  const [transferValue, setTransferValue] = useState(0);

  const apiUrl = 'http://localhost:3001';

  const handleUploadFile = async () => {
    if (file) {
      socket = io(apiUrl);

      socket.on("connect", () => {
        console.log('CONNECTED', socket.id);
      });

      socket.on('get-slice-size', data => {
        const { size } = data;
        sliceSize = size;
        console.log(size);
      });

      const fileReader = new FileReader(), slice = file.slice(0, sliceSize);
      fileReader.readAsArrayBuffer(slice);

      fileReader.onload = (evt) => {
        const arrayBuffer = fileReader.result;
        socket.emit('slice-upload', {
          name: file.name,
          type: file.type,
          size: file.size,
          data: arrayBuffer
        });
      }

      socket.on('request-slice-upload', (data) => {
        const place = data.currentSlice * sliceSize;
        const slice = file.slice(place, place + Math.min(sliceSize, file.size - place));

        setTransferValue(((place / file.size) * 100).toFixed(2));

        fileReader.readAsArrayBuffer(slice);
      });

      socket.on('end-upload', (_) => {
        socket.disconnect();
        setTransferValue(0);

        alert('Arquivo enviado com sucesso.');

        setFile(null);
      });

      socket.on('upload-error', (_) => {
        socket.disconnect();
        setTransferValue(0);

        alert('Houve um problema ao enviar seu arquivo. Tente novamente.');
      });
    }
    else alert("Por favor, escolha um arquivo.");
  }

  return (
    <main>
      <label htmlFor="input-file">
        <img src={defaultImage} alt="Select File" />
      </label>

      <b>{file ? file.name : 'Escolha um arquivo.'}</b>
      <span>{transferValue}%</span>

      <input
        id="input-file"
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <div onClick={handleUploadFile} className="upload-button">
        <b>Enviar</b>
      </div>
    </main>
  )
}
