import React, {useState} from 'react';
import { RiHome2Line, RiMoreLine, RiMoonLine, RiUser2Line, RiLoginBoxLine, RiLogoutBoxRLine, RiSettings4Line } from 'react-icons/ri';
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useSelector, useDispatch } from "react-redux";
import { TOGGLE_DARKTHEME, DELETE_AUCH } from "../../redux/actions";
import { withCookies } from 'react-cookie';

import BrandIcon from '~/components/Icons/brand-1.svg';

const Item = (props) => {
  const router = useRouter()
  
  let className = props.className;

  if(props.href){
    if(router.asPath == (props.as || props.href)){
      className += " active"
    }

    return (
      <Link href={props.href} as={props.as || null}>
        <div className={className}>
          {React.cloneElement(props.children,{className: 'icon'})}
        </div>
      </Link>
    )
  } else if(props.onClick){
    if(props.active){
      className += " active"
    }

    return (
      <div onClick={props.onClick} className={className}>
        {React.cloneElement(props.children,{className: 'icon'})}
      </div>
    )
  } else if(props.brand){
    return (
      <Link href={'/'}>
        <a className={className+` brandItem d-none d-lg-flex`} style={{height: 60}}>
          {React.cloneElement(props.children,{className: 'icon brandIcon'})}
        </a>
      </Link>
    )
  }
}

const Navbar = (props) => {
  const [burger, setBurger] = useState(false);

  const toggleBurger = ()=>{
    setBurger(!burger);
  }

  let className='page-navbar';
  if(burger && props.cookies.get('accessToken')){
    className += " opened"
  }

  const accessToken = useSelector((state) => state.preferences.access);
  const dispatch = useDispatch();

  const logout = ()=>{
    props.cookies.remove('accessToken', { path: "/" });
    dispatch({ type: DELETE_AUCH });
  }
  
  const handleToggleDrakmode = ()=>{
    props.cookies.set('darkThemeEnabled', !props.darkThemeEnabled, { maxAge: 30 * 24 * 60 * 60, path: "/" });
    dispatch({ type: TOGGLE_DARKTHEME })
  }


  return (<>
    <div className={className}>
      <Item brand className='item brand'><BrandIcon/></Item>
      <Item className='item' href="/"><RiHome2Line size={36} /></Item>

      {!props.cookies.get('accessToken') && <Item className='item' href="/login"><RiLoginBoxLine size={36} /></Item>}
      {props.cookies.get('accessToken') && <Item className='item' href="/user/[id]" as="/user/me"><RiUser2Line size={36} /></Item>}

      {props.cookies.get('accessToken') && <Item className='item' href="/controlPanel"><RiSettings4Line size={36} /></Item>}
      {props.cookies.get('accessToken') && <Item className='item d-md-none' onClick={toggleBurger} active={burger}><RiMoreLine size={36} /></Item>}
      
      <Item className='item' onClick={handleToggleDrakmode} active={props.darkThemeEnabled}><RiMoonLine size={36} /></Item>

      {props.cookies.get('accessToken') && <Item className='item' onClick={logout}><RiLogoutBoxRLine color='#b54343' size={36} /></Item>}
    </div>
  </>)
  
}

export default withCookies(Navbar)
